<?php

use App\Services\ReceiptPrinterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;

/*
|--------------------------------------------------------------------------
| API Routes - Network-Based Printer Integration
|--------------------------------------------------------------------------
|
| Route untuk pencetakan struk thermal via HTTP POST ke printer client.
| Menggunakan Distributed Stand Architecture - Laravel server sebagai
| Central Brain yang mendelegasikan perintah cetak ke laptop client.
|
*/

Route::middleware(['auth:sanctum'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Print Receipt - Cetak struk order lengkap via HTTP POST
    |--------------------------------------------------------------------------
    |
    | Endpoint: POST /api/print-receipt
    |
    | Request Body:
    | {
    |   "invoice": "TRX-20260510-001",
    |   "items": [
    |     { "name": "Nasi Goreng", "qty": 2, "price": 15000, "subtotal": 30000, "discount": 0 },
    |     { "name": "Es Teh Manis", "qty": 1, "price": 5000, "subtotal": 5000, "discount": 0 }
    |   ],
    |   "subtotal": 35000,
    |   "discount": 0,
    |   "total": 35000,
    |   "paid": 50000,
    |   "change": 15000,
    |   "cashier": "Admin",
    |   "payment_method": "cash"
    | }
    |
    */
    Route::post('/print-receipt', function (Request $request): JsonResponse {
        $validated = $request->validate([
            'invoice'        => 'required|string|max:50',
            'items'          => 'required|array|min:1',
            'items.*.name'   => 'required|string|max:100',
            'items.*.qty'    => 'required|integer|min:1',
            'items.*.price'  => 'required|numeric|min:0',
            'items.*.subtotal' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'subtotal'       => 'required|numeric|min:0',
            'discount'       => 'nullable|numeric|min:0',
            'total'          => 'required|numeric|min:0',
            'paid'           => 'nullable|numeric|min:0',
            'change'         => 'nullable|numeric|min:0',
            'cashier'        => 'nullable|string|max:50',
            'payment_method' => 'nullable|string|max:20',
        ]);

        try {
            $printerService = new ReceiptPrinterService();
            $printerService->printReceipt($validated);

            return response()->json([
                'success' => true,
                'message' => 'Struk berhasil dicetak!',
                'invoice' => $validated['invoice'],
            ]);
        } catch (\Exception $e) {
            Log::error('API print-receipt error: ' . $e->getMessage(), [
                'invoice' => $validated['invoice'] ?? 'unknown',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mencetak struk: ' . $e->getMessage(),
            ], 503);
        }
    });

    /*
    |--------------------------------------------------------------------------
    | Test Printer Connection - Cek koneksi ke printer client
    |--------------------------------------------------------------------------
    |
    | Endpoint: GET /api/printer/test
    |
    */
    Route::get('/printer/test', function (): JsonResponse {
        try {
            $printerService = new ReceiptPrinterService();
            $printerService->testConnection();

            return response()->json([
                'success' => true,
                'message' => 'Printer client terhubung dengan baik!',
            ]);
        } catch (\Exception $e) {
            Log::error('API printer/test error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal terhubung ke printer client: ' . $e->getMessage(),
            ], 503);
        }
    });
});
