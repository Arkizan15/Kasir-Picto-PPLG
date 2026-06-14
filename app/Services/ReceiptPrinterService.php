<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReceiptPrinterService
{
    protected string $printerServerUrl;
    protected int $printerId;

    public function __construct()
    {
        // Mengambil target URL IP Laptop Stand DKV dari berkas .env
        $this->printerServerUrl = env('PRINTER_SERVER_URL', 'http://localhost:9000');
        $this->printerId = (int) env('PRINTER_ID', 1);
    }

    /**
     * Mengirim data transaksi DKV ke Laptop Client via HTTP POST JSON
     */
    public function printReceipt(array $data): void
    {
        try {
            // Pemetaan data agar cocok 100% dengan pydantic Order di main.py Python terbaru
            $payload = [
                'invoice'        => $data['invoice'] ?? $data['invoice_number'] ?? 'INV-' . time(),
                'cashier'        => $data['cashier'] ?? 'Kasir DKV',
                'payment_method' => $data['payment_method'] ?? 'cash',
                'subtotal'       => (float) $data['subtotal'],
                'discount'       => (float) ($data['discount'] ?? 0),
                'total'          => (float) $data['total'],
                'paid'           => (float) ($data['paid'] ?? $data['total']),
                'change'         => (float) ($data['change'] ?? 0),
                'items'          => array_map(function($item) {
                    return [
                        'name'     => $this->cleanText($item['name'] ?? $item['product_name']),
                        'qty'      => (int) ($item['qty'] ?? $item['quantity']),
                        'price'    => (float) $item['price'],
                        'subtotal' => (float) (($item['qty'] ?? $item['quantity']) * $item['price']),
                        'discount' => (float) ($item['discount'] ?? 0)
                    ];
                }, $data['items']),
            ];

            $endpointUrl = "{$this->printerServerUrl}/print_receipt?printer_id={$this->printerId}";
            Log::info("[PRINTER DKV] Menembak data struk ke: " . $endpointUrl);
            
            // Kirim data ke laptop stand DKV dengan batas waktu toleransi (timeout) 5 detik
            $response = Http::timeout(5)->post($endpointUrl, $payload);

            if (!$response->successful()) {
                throw new \Exception("Printer server DKV merespon dengan kode error: " . $response->status());
            }

        } catch (\Exception $e) {
            Log::error('[PRINTER DKV] Gagal mengirim data cetak: ' . $e->getMessage());
            throw new \Exception('Gagal mencetak! Pastikan script Python di Laptop Stand DKV sudah aktif dan terhubung ke Wi-Fi yang sama.');
        }
    }

    /**
     * Memastikan server Python target dalam keadaan online
     */
    public function testConnection(): void
    {
        try {
            Http::timeout(2)->get($this->printerServerUrl . '/');
        } catch (\Exception $e) {
            throw new \Exception("Printer server DKV offline atau alamat IP salah.");
        }
    }

    /**
     * Pembersih teks otomatis dari karakter aneh/emoji agar printer Bluetooth tidak macet
     */
    protected function cleanText(string $text): string
    {
        $clean = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
        return preg_replace('/[^\x20-\x7E]/', '', (string) $clean);
    }
}