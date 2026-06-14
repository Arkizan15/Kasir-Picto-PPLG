<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ActivityLog;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductsController extends Controller
{
    /**
     * Halaman daftar produk (Produk Page).
     */
    public function index()
    {
        $products = Product::with('category')
            ->orderBy('created_at', 'desc')
            ->get();

        $categories = Category::all();

        $activityLogs = ActivityLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(15)
            ->get()
            ->map(function ($log) {
                return [
                    'id'          => $log->id,
                    'user'        => $log->user->username ?? '-',
                    'action'      => $log->action,
                    'description' => $log->description,
                    'time'        => $log->created_at->format('d/m/Y H:i'),
                ];
            });

        return Inertia::render('Admin/Produk', [
            'products'     => $products,
            'categories'   => $categories,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Halaman form tambah produk.
     */
    public function create()
    {
        return Inertia::render('Admin/Add_Product', [
            'categories' => Category::all(),
        ]);
    }

    /**
     * Halaman form edit produk.
     */
    public function edit(Product $product)
    {
        return Inertia::render('Admin/Edit_Product', [
            'product'    => $product,
            'categories' => Category::all(),
        ]);
    }

    /**
     * Simpan produk baru.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'price'       => 'required|numeric',
            'stock'       => 'required|integer',
            'category_id' => 'nullable|exists:categories,id',
            'image'       => 'nullable|image|mimes:jpg,jpeg,png|max:10240',
        ]);

        $data = $request->all();

        if (empty($data['category_id'])) {
            $data['category_id'] = null;
        }

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image_url'] = '/storage/' . $path;
        }

        $product = Product::create($data);

        // Log aktivitas
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action'      => 'create',
            'description' => "Menambahkan produk baru: {$product->name}",
        ]);

        return redirect('/admin/produk')->with('success', 'Produk Berhasil Ditambahkan');
    }

    /**
     * Update produk (stok, harga, nama, dll).
     */
    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name'        => 'sometimes|string|max:255',
            'price'       => 'sometimes|numeric',
            'stock'       => 'sometimes|integer',
            'category_id' => 'nullable|exists:categories,id',
            'image'       => 'nullable|image|mimes:jpg,jpeg,png|max:10240',
        ]);

        $oldName = $product->name;
        $changes = [];

        foreach (['name', 'price', 'stock'] as $field) {
            if ($request->has($field) && $request->{$field} != $product->{$field}) {
                $changes[] = "{$field}: {$product->{$field}} → {$request->{$field}}";
            }
        }

        $data = $request->only([
            'name', 'price', 'stock', 'category_id',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            // Hapus image lama jika ada
            if ($product->image_url) {
                $oldImagePath = str_replace('/storage/', '', $product->image_url);
                Storage::disk('public')->delete($oldImagePath);
            }

            // Upload image baru
            $path = $request->file('image')->store('products', 'public');
            $data['image_url'] = '/storage/' . $path;
            $changes[] = "image: changed";
        }

        $product->update($data);

        // Log aktivitas
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action'      => 'update',
            'description' => "Mengubah produk \"{$oldName}\": " . (empty($changes) ? 'No change' : implode(', ', $changes)),
        ]);

        return redirect('/admin/produk')->with('success', 'Produk Berhasil Diperbarui');
    }

    /**
     * Hapus produk.
     */
    public function destroy(Product $product)
    {
        $name = $product->name;
        $product->delete();

        // Log aktivitas
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action'      => 'delete',
            'description' => "Menghapus produk: {$name}",
        ]);

        return redirect('/admin/produk')->with('success', 'Produk Berhasil Dihapus');
    }
}
