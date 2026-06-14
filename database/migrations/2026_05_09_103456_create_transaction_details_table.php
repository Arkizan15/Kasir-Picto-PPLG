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
    Schema::create('transaction_details', function (Blueprint $table) {
        $table->id();
        // FK ke transaksi (string)
        $table->string('transaction_id');
        $table->foreign('transaction_id')->references('id')->on('transactions')->onDelete('cascade');
        
        // FK ke produk
        $table->foreignId('product_id')->constrained('products');
        
        $table->integer('quantity');
        $table->decimal('price_at_transaction', 12, 2); // Snapshot harga
        $table->decimal('subtotal', 12, 2);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction_details');
    }
};
