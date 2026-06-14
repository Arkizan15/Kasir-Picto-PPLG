<?php

namespace App\Http\Controllers;

use App\Exports\DailyTransactionExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    /**
     * Export transaksi by selected date ke file Excel (.xlsx).
     */
    public function exportToday(Request $request)
    {
        $date = $request->query('date', now()->toDateString());
        $searchDate = \Carbon\Carbon::parse($date)->toDateString();

        Log::info('Export requested', ['date' => $date, 'search_date' => $searchDate]);

        $transactions = \App\Models\Transaction::with(['details.product', 'user'])
            ->whereDate('created_at', $searchDate)
            ->orderBy('created_at', 'desc')
            ->get();

        Log::info('Export transaction count', [
            'count' => $transactions->count(),
            'ids' => $transactions->pluck('id')->toArray(),
            'created_at' => $transactions->pluck('created_at')->map(fn($date) => $date->toDateTimeString())->toArray(),
        ]);

        $filename = 'Laporan_Penjualan_' . $searchDate . '.xlsx';

        return Excel::download(new DailyTransactionExport($searchDate), $filename);
    }
}
