<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Halaman Dashboard Admin dengan data real.
     */
    public function index()
    {
        // Revenue hari ini
        $todayRevenue = Transaction::whereDate('created_at', today())
            ->sum('total_price');

        // Jumlah transaksi hari ini
        $todayTransactions = Transaction::whereDate('created_at', today())
            ->count();

        // Data chart 7 hari terakhir
        $chartData = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo);
            $total = Transaction::whereDate('created_at', $date->toDateString())
                ->sum('total_price');

            return [
                'name'  => $date->translatedFormat('D'),
                'date'  => $date->format('d/m'),
                'total' => (float) $total,
            ];
        })->values()->toArray();

        return Inertia::render('Admin/Dashboard', [
            'todayRevenue'      => (float) $todayRevenue,
            'todayTransactions' => $todayTransactions,
            'chartData'         => $chartData,
        ]);
    }
}
