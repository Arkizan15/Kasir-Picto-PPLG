import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Package, ArrowLeft, Save, Image as ImageIcon, Plus, X } from 'lucide-react';

export default function EditProduct({ product, categories = [] }) {
    // Inisialisasi useForm dari Inertia dengan data produk yang ada
    const { data, setData, patch, processing, errors } = useForm({
        name: product.name || '',
        price: product.price ? String(product.price) : '',
        stock: product.stock || '',
        category_id: product.category_id || '',
        image: null,
    });

    const [priceInput, setPriceInput] = useState(
        product.price ? Number(product.price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : ''
    );

    const [imagePreview, setImagePreview] = useState(null);

    const handlePriceChange = (e) => {
        // Hapus semua karakter selain angka
        let rawValue = e.target.value.replace(/[^0-9]/g, '');
        
        // Update raw value ke Inertia state
        setData('price', rawValue);
        
        // Format untuk tampilan input
        setPriceInput(rawValue ? Number(rawValue).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '');
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);
            // Buat preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImagePreview = () => {
        setData('image', null);
        setImagePreview(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Gunakan patch untuk update dengan method spoofing jika perlu
        patch(`/products/${product.id}`, {
            onSuccess: () => {
                // Success handling dilakukan oleh Inertia redirect
            },
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <Head title="Edit Produk - Kasir Picto" />

            <div className="max-w-3xl mx-auto">
                {/* Header Navigasi */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/produk" className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition">
                            <ArrowLeft size={20} className="text-slate-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Edit Produk</h1>
                            <p className="text-sm text-slate-500 mt-1">{product.name}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 space-y-6">

                        {/* Nama Produk */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Produk</label>
                            <input
                                type="text"
                                className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-indigo-500 outline-none transition`}
                                placeholder="Contoh: Kopi Susu Gula Aren"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Harga */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Harga Jual (Rp)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    placeholder="0"
                                    value={priceInput}
                                    onChange={handlePriceChange}
                                />
                                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                            </div>

                            {/* Stok */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Jumlah Stok</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    placeholder="0"
                                    value={data.stock}
                                    onChange={e => setData('stock', e.target.value)}
                                />
                                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                            </div>
                        </div>

                        {/* Kategori */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Kategori (Opsional)</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white"
                                value={data.category_id}
                                onChange={e => setData('category_id', e.target.value)}
                            >
                                <option value="">Pilih Kategori</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
                        </div>

                        {/* Current Image Display or New Image Preview */}
                        {imagePreview ? (
                            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50">
                                <p className="text-sm font-semibold text-slate-700 mb-3">Preview Gambar Baru</p>
                                <div className="relative inline-block">
                                    <img src={imagePreview} alt="Preview" className="h-48 w-auto rounded-xl object-cover" />
                                </div>
                            </div>
                        ) : product.image_url ? (
                            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50">
                                <p className="text-sm font-semibold text-slate-700 mb-3">Gambar Produk Saat Ini</p>
                                <img src={product.image_url} alt={product.name} className="h-48 w-auto rounded-xl object-cover" />
                            </div>
                        ) : null}

                        {/* Upload Gambar */}
                        <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center">
                            <ImageIcon size={40} className="text-slate-400 mb-3" />
                            <label className="cursor-pointer bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                                <Plus size={16} className="inline mr-2" /> {data.image ? 'Ubah' : 'Pilih'} Foto Produk
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                />
                            </label>
                            {data.image && (
                                <div className="mt-3 flex items-center gap-2">
                                    <p className="text-sm text-indigo-600 font-medium">{data.image.name}</p>
                                    <button
                                        type="button"
                                        onClick={clearImagePreview}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                        title="Hapus preview"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                            {!data.image && !product.image_url && <p className="mt-3 text-sm text-slate-500">(Opsional)</p>}
                            {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition disabled:opacity-50"
                        >
                            <Save size={18} /> {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
