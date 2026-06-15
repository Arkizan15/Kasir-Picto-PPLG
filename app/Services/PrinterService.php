<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Mike42\Escpos\Printer;
use Mike42\Escpos\EscposImage;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;


class PrinterService
{
    protected Printer $printer;
    protected string $printerName;
    protected int $charsPerLine;

    public function __construct()
    {
        $this->printerName = config('printer.printer_name', env('PRINTER_NAME', 'COM7:'));
        $this->charsPerLine = (int) config('printer.chars_per_line', env('PRINTER_CHARS_PER_LINE', 32));
    }

    protected function connect(): void
    {
        try {
            $connectorType = config('printer.connector', 'file');

            // LOGIKA BARU: Cek jenis konektor
            if ($connectorType === 'file') {
                // Gunakan FilePrintConnector untuk port COM (Contoh: "COM7:")
                $connector = new FilePrintConnector($this->printerName);
            } else {
                // Fallback ke Windows Share jika suatu saat dikonfigurasi ulang
                $name = $this->printerName;
                if (!str_starts_with($name, 'smb://') && !str_starts_with($name, '//')) {
                    $name = 'smb://localhost/' . $name;
                }
                $connector = new WindowsPrintConnector($name);
            }

            $this->printer = new Printer($connector);
            $this->printer->initialize();
        } catch (\Exception $e) {
            Log::error('[PRINTER] Hubungan ke perangkat gagal: ' . $e->getMessage());
            throw new \Exception('Printer thermal tidak terjangkau. Periksa apakah port COM7 sedang digunakan aplikasi lain atau kabel bluetooth lepas.');
        }
    }

    // ... (Method printLogo, printReceipt, printItemFormat, dll biarkan sama seperti sebelumnya) ...

    public function pingDeviceSilent(): void
    {
        $this->connect();
        if (isset($this->printer)) {
            $this->printer->close();
        }
    }

    /**
     * Alias untuk pingDeviceSilent() - digunakan oleh API endpoint
     */
    public function testConnection(): void
    {
        $this->pingDeviceSilent();
    }

    protected function cleanText(string $text): string
    {
        $clean = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
        return preg_replace('/[^\x20-\x7E]/', '', (string) $clean);
    }

    protected function safeClose(): void
    {
        try {
            if (isset($this->printer)) {
                $this->printer->close();
            }
        } catch (\Throwable $e) {
            Log::warning('[PRINTER] Safe close diabaikan: ' . $e->getMessage());
        }
    }
}