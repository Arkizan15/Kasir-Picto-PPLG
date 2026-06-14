<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('transactions', function (Blueprint $table) {
        // Kita gunakan string untuk ID Transaksi kustom (seperti TRX-20240101-001)
        $table->string('id')->primary(); 
        $table->decimal('total_price', 12, 2);
        $table->decimal('paid_amount', 12, 2);
        $table->decimal('change_amount', 12, 2);
        // Menghubungkan ke tabel users (Kasir)
        $table->foreignId('user_id')->constrained('users');
        $table->timestamps(); // Menggantikan kolom Date otomatis
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
