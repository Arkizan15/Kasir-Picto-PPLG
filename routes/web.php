<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\ProductsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Guest Routes
Route::middleware('guest')->group(function () {
    Route::get('/', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
});

// Authenticated Routes
Route::middleware('auth')->group(function () {
    Route::get('/catalog', function () {
        return Inertia::render('Catalog', [
        'products' => \App\Models\Product::all()
        ]);
    })->name('catalog');
    Route::get('/admin', [\App\Http\Controllers\DashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/admin/produk', [\App\Http\Controllers\ProductsController::class, 'index'])->name('admin.produk');
    Route::get('/admin/penjualan', function () {
        return Inertia::render('Admin/Penjualan');
    })->name('admin.penjualan');
    
    // Order & Chart endpoints
    Route::post('/admin/orders', [\App\Http\Controllers\OrderController::class, 'store']);
    Route::get('/admin/orders/today', [\App\Http\Controllers\OrderController::class, 'todayHistory']);
    Route::get('/admin/orders/dates', [\App\Http\Controllers\OrderController::class, 'availableDates']);
    Route::get('/admin/printer/test', [\App\Http\Controllers\OrderController::class, 'testPrinter']);
    Route::get('/admin/chart/daily', [\App\Http\Controllers\OrderController::class, 'dailyChart']);
    Route::get('/admin/export/today', [\App\Http\Controllers\ExportController::class, 'exportToday']);

    Route::resource('products', \App\Http\Controllers\ProductsController::class);
    
    Route::post('/logout', [LoginController::class, 'destroy']);
});
