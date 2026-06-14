<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\Product;
use App\Services\ReceiptPrinterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Proses order baru:
     * 1. Validasi input
     * 2. Cetak struk ke printer thermal via HTTP POST
     * 3. Jika print berhasil → simpan ke database & kurangi stok
     * 4. Jika print gagal → rollback transaction & return error
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items'            => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.name'     => 'required|string|max:100',
            'items.*.qty'      => 'required|integer|min:1',
            'items.*.price'    => 'required|numeric|min:0',
            'items.*.subtotal' => 'required|numeric|min:0',
            'subtotal'         => 'required|numeric|min:0',
            'total'            => 'required|numeric|min:0',
            'paid'             => 'nullable|numeric|min:0',
            'change'           => 'nullable|numeric|min:0',
            'cashier'          => 'nullable|string|max:50',
        ]);

        // Generate invoice number: PICTO-YYYYMMDD-XXX
        $today = now()->format('Ymd');
        $count = Transaction::where('id', 'LIKE', "PICTO-{$today}-%")->count() + 1;
        $invoiceNumber = sprintf("PICTO-%s-%03d", $today, $count);

        try {
            DB::beginTransaction();

            // === STEP 1: VALIDASI STOK ===
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                if (!$product || $product->stock < $item['qty']) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Stok tidak cukup untuk: {$item['name']}. Tersisa: " . ($product?->stock ?? 0),
                        'invoice' => null,
                    ], 422);
                }
            }

            // === STEP 2: CETAK STRUK VIA HTTP POST (BLOCKING) ===
            // Print sebelum commit ke DB - jika gagal, transaction akan di-rollback
            try {
                ini_set('max_execution_time', 30); // 30 detik max untuk printing
                
                $printerService = new ReceiptPrinterService();

                $printItems = collect($validated['items'])->map(function ($item) {
                    return [
                        'name'     => $item['name'],
                        'qty'      => $item['qty'],
                        'price'    => $item['price'],
                        'subtotal' => $item['subtotal'],
                    ];
                })->toArray();

                $printerService->printReceipt([
                    'invoice'        => $invoiceNumber,
                    'items'          => $printItems,
                    'subtotal'       => (float) $validated['subtotal'],
                    'discount'       => (float) ($validated['discount'] ?? 0),
                    'total'          => (float) $validated['total'],
                    'paid'           => (float) ($validated['paid'] ?? 0),
                    'change'         => (float) ($validated['change'] ?? 0),
                    'cashier'        => $validated['cashier'] ?? '',
                    'payment_method' => $validated['payment_method'] ?? 'cash',
                ]);

                Log::info("Struk {$invoiceNumber} berhasil dicetak.");

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('OrderController@store: Print gagal — ' . $e->getMessage());
                
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal mencetak struk: ' . $e->getMessage(),
                    'invoice' => null,
                ], 503); // Service Unavailable - printer client offline
            }

            // === STEP 3: SIMPAN KE DATABASE (HANYA JIKA PRINT BERHASIL) ===
            $transaction = Transaction::create([
                'id'            => $invoiceNumber,
                'total_price'   => $validated['total'],
                'user_id'       => Auth::id(),
            ]);

            foreach ($validated['items'] as $item) {
                TransactionDetail::create([
                    'transaction_id'       => $invoiceNumber,
                    'product_id'           => $item['product_id'],
                    'quantity'             => $item['qty'],
                    'price_at_transaction' => $item['price'],
                    'subtotal'             => $item['subtotal'],
                    'discount_applied'     => $item['discount'] ?? 0,
                ]);

                // Kurangi stok produk
                Product::where('id', $item['product_id'])
                    ->decrement('stock', $item['qty']);
            }

            DB::commit();

            Log::info("Order {$invoiceNumber} berhasil disimpan & stok dikurangi.");

            return response()->json([
                'success' => true,
                'message' => 'Order berhasil disimpan & struk tercetak!',
                'invoice' => $invoiceNumber,
                'printed' => true,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('OrderController@store: Gagal menyimpan order — ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan order: ' . $e->getMessage(),
                'invoice' => null,
            ], 500);
        }
    }

    /**
     * Test koneksi printer Epson TM-T82.
     */
    public function testPrinter(): JsonResponse
    {
        try {
            $printerService = new ReceiptPrinterService();
            $printerService->testConnection();

            return response()->json([
                'success' => true,
                'message' => 'Printer terhubung dengan baik!',
            ]);
        } catch (\Exception $e) {
            Log::error('OrderController@testPrinter: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal terhubung ke printer: ' . $e->getMessage(),
            ], 503);
        }
    }

    /**
     * Histori transaksi dengan filter tanggal untuk halaman Penjualan.
     */
    public function todayHistory(Request $request)
    {
        $date = $request->query('date');
        
        $query = Transaction::with(['details.product', 'user'])
            ->orderBy('created_at', 'desc');
            
        if ($date) {
            $query->whereDate('created_at', $date);
        } else {
            $query->whereDate('created_at', today());
        }
            
        $transactions = $query->get()
            ->map(function ($trx) {
                return [
                    'id'            => $trx->id,
                    'total_price'   => $trx->total_price,
                    'cashier'       => $trx->user->username ?? '-',
                    'created_at'    => $trx->created_at->format('H:i:s'),
                    'full_date'     => $trx->created_at->format('Y-m-d'),
                    'items'         => $trx->details->map(function ($d) {
                        return [
                            'product_name'  => $d->product->name ?? 'Deleted',
                            'quantity'      => $d->quantity,
                            'price'         => $d->price_at_transaction,
                            'subtotal'      => $d->subtotal,
                            'discount'      => $d->discount_applied,
                        ];
                    }),
                ];
            });

        return response()->json($transactions);
    }

    /**
     * Get available dates with transactions for filter.
     */
    public function availableDates()
    {
        $dates = Transaction::selectRaw('DATE(created_at) as date')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->limit(30)
            ->pluck('date');

        return response()->json($dates);
    }

    /**
     * Data chart penjualan harian 7 hari terakhir.
     */
    public function dailyChart(): JsonResponse
    {
        $days = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo);
            $total = Transaction::whereDate('created_at', $date->toDateString())
                ->sum('total_price');

            return [
                'name'  => $date->translatedFormat('D'),   // Sen, Sel, Rab ...
                'date'  => $date->format('d/m'),
                'total' => (float) $total,
            ];
        });

        return response()->json($days);
    }
}
