<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom min_stock_threshold ke tabel products.
     * Digunakan untuk mendeteksi "Stok Menipis" di dashboard.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->integer('min_stock_threshold')->default(5)->after('stock');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('min_stock_threshold');
        });
    }
};
