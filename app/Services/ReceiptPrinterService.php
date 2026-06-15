<?php

namespace App\Services;

use Mike42\Escpos\PrintConnectors\FilePrintConnector; // TAMBAHKAN
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector; 
use Mike42\Escpos\Printer;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use Mike42\Escpos\EscposImage;
use App\Services\LogoProcessor;

class ReceiptPrinterService
{
    protected Printer $printer;
    protected int $charsPerLine;
    protected int $leftMarginDots;

    public function __construct()
    {
        $this->charsPerLine = (int) config('printer.chars_per_line', env('PRINTER_CHARS_PER_LINE', 32));
        $this->leftMarginDots = 0;
        $this->connect();
    }

    protected function connect(): void
    {
        try {
            $connectorType = config('printer.connector', 'file');
            $printerName = config('printer.printer_name', 'COM7:');

            if ($connectorType === 'file') {
                $connector = new FilePrintConnector($printerName);
            } else {
                if (!str_starts_with($printerName, 'smb://') && !str_starts_with($printerName, '//')) {
                    $printerName = 'smb://localhost/' . $printerName;
                }
                $connector = new WindowsPrintConnector($printerName);
            }

            $this->printer = new Printer($connector);
        } catch (\Exception $e) {
            Log::error('[PRINTER] Koneksi ReceiptPrinterService gagal: ' . $e->getMessage());
            throw new \Exception('Gagal terhubung ke printer di port COM7.');
        }
    }

    /**
     * Mencetak logo dari alamat penyimpanan berkas absolut sistem Laragon Windows
     */
    protected function printLogo(): void
    {
        try {
            // Sinkronisasi target path absolut logo DKV1
            $logoPath = "C:\\laragon\\www\\Kasir_Picto_DKV1\\logo picto 8 rev (1)-01.png";
            
            if (file_exists($logoPath)) {
                $processedPath = LogoProcessor::process($logoPath, 384); // Resolusi optimal kertas thermal 58mm
                if ($processedPath && file_exists($processedPath)) {
                    $logo = EscposImage::load($processedPath);
                    $this->printer->setJustification(Printer::JUSTIFY_CENTER);
                    try {
                        $this->printer->bitImage($logo);
                    } catch (\Exception $e) {
                        $this->printer->graphics($logo);
                    }
                    $this->printer->feed(1);
                }
            } else {
                Log::warning('[PRINTER] Berkas logo toko tidak ditemukan di path absolut: ' . $logoPath);
            }
        } catch (\Exception $e) {
            Log::warning('[PRINTER] Gagal memuat logo grafis pada struk: ' . $e->getMessage());
        }
    }

    public function printReceipt(array $data): void
    {
        try {
            $this->printer->initialize();
            
            // 1. LOGO GRAFIS TOKO DI BAGIAN PALING ATAS STRUKS
            $this->printLogo();

            // Membaca konfigurasi teks struk belanja dari berkas .env Anda
            $storeName = config('printer.store_name', env('PRINTER_STORE_NAME', 'PICTOGRAFEST 8'));
            $storeAddress = config('printer.store_address', env('PRINTER_STORE_ADDRESS', 'SMKN 1 Banyuwangi'));
            $footerMessage = config('printer.footer_message', env('PRINTER_FOOTER_MESSAGE', 'Terima Kasih Atas Kunjungan Anda!'));

            // 2. DATA UTAMA HEADER NOTA
            $this->printer->setJustification(Printer::JUSTIFY_CENTER);
            $this->printer->setEmphasis(true);
            $this->printer->setTextSize(1, 1); // Skala teks normal terproteksi dari masalah patah kata di 32 karakter
            $this->printer->setEmphasis(false);
            
            $this->printer->setJustification(Printer::JUSTIFY_LEFT);

            // 3. INFORMASI METADATA TRANSAKSI KASIR
            $invoice  = $this->cleanText($data['invoice'] ?? $data['order_id'] ?? 'N/A');
            $datetime = isset($data['datetime'])
                ? Carbon::parse($data['datetime'])->format('d/m/Y H:i')
                : now('Asia/Jakarta')->format('d/m/Y H:i');

            if (strlen($invoice) > 18) {
                $invoice = substr($invoice, 0, 18);
            }

            $this->printRow('Nota', $invoice);
            $this->printRow('Tgl', $datetime);
            $this->printDivider('-');

            // 4. DAFTAR BARANG BELANJAAN (Menggunakan skema wordwrap 32 Karakter)
            foreach ($data['items'] ?? [] as $item) {
                $name = $this->cleanText($item['name'] ?? 'Item');
                $qty  = (int) ($item['qty'] ?? 1);
                $qtyText = 'x' . $qty;

                $maxNameWidth = $this->charsPerLine - strlen($qtyText) - 1;

                $wrappedName = wordwrap($name, $maxNameWidth, "\n", true);
                $lines = explode("\n", $wrappedName);

                for ($i = 0; $i < count($lines); $i++) {
                    $currentLine = trim($lines[$i]);
                    if ($i === count($lines) - 1) {
                        $spaces = $this->charsPerLine - mb_strlen($currentLine) - strlen($qtyText);
                        $spacer = str_repeat(' ', max(1, $spaces));
                        $this->printer->text($currentLine . $spacer . $qtyText . "\n");
                    } else {
                        $this->printer->text($currentLine . "\n");
                    }
                }
            }
            $this->printDivider('-');

            // 5. SUMMARY NOTA BELANJA
            $total  = (float) ($data['total'] ?? 0);
            $paid   = (float) ($data['paid'] ?? 0);
            $change = (float) ($data['change'] ?? max(0, $paid - $total));

            $this->printer->feed(1);
            $this->printer->setEmphasis(true);
            $this->printRow('TOTAL', $this->formatCurrency($total));
            $this->printer->setEmphasis(false);

            if ($paid > 0) {
                $this->printRow('BAYAR', $this->formatCurrency($paid));
                $this->printRow('KMBL', $this->formatCurrency($change));
            }
            $this->printDivider('-');

            // 6. AREA FOOTER NOTA
            $this->printer->setJustification(Printer::JUSTIFY_CENTER);
            $this->printer->setEmphasis(true);
            $this->printer->text($this->cleanText($footerMessage) . "\n");
            $this->printer->setEmphasis(false);
            $this->printer->text("Simpan struk ini sebagai\n");
            $this->printer->text("bukti pembayaran.\n");

            // Gulung kertas dan potong otomatis struk kasir
            $this->printer->feed(3);
            $this->printer->cut(Printer::CUT_FULL);
            $this->printer->close();

        } catch (\Exception $e) {
            Log::error('[PRINTER] Kegagalan cetak ReceiptPrinterService: ' . $e->getMessage());
            $this->safeClose();
            throw new \Exception('Gagal mencetak struk belanja toko.');
        }
    }

    // ==================== METODE HELPER ====================

    protected function printRow(string $left, string $right): void
    {
        $left  = $this->cleanText($left);
        $right = $this->cleanText($right);

        $availableSpaceForLabel = $this->charsPerLine - strlen($right) - 1;
        if (strlen($left) > $availableSpaceForLabel) {
            $left = substr($left, 0, $availableSpaceForLabel);
        }

        $totalSpaces = $this->charsPerLine - strlen($left) - strlen($right);
        $this->printer->text($left . str_repeat(' ', max(1, $totalSpaces)) . $right . "\n");
    }

    protected function printDivider(string $char = '-'): void
    {
        $this->printer->setJustification(Printer::JUSTIFY_LEFT);
        $this->printer->text(str_repeat($char, $this->charsPerLine) . "\n");
    }

    protected function formatCurrency(float $amount): string
    {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }

    protected function cleanText(string $text): string
    {
        $filtered = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
        return preg_replace('/[^\x20-\x7E]/', '', (string)$filtered);
    }

    protected function safeClose(): void
    {
        try {
            if (isset($this->printer)) {
                $this->printer->close();
            }
        } catch (\Throwable $e) {
            Log::warning('[PRINTER] Gagal menutup aliran printer kasir: ' . $e->getMessage());
        }
    }
}