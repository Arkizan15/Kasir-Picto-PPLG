import { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Package, ArrowLeft, Save, Image as ImageIcon, Plus } from 'lucide-react';

export default function CreateProduct({ categories = [] }) {
    // Inisialisasi useForm dari Inertia
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        price: '',
        stock: '',
        category_id: '',
        image: null,
    });

    const [priceInput, setPriceInput] = useState('');

    const handlePriceChange = (e) => {
        // Hapus semua karakter selain angka
        let rawValue = e.target.value.replace(/[^0-9]/g, '');
        
        // Update raw value ke Inertia state
        setData('price', rawValue);
        
        // Format untuk tampilan input
        setPriceInput(rawValue ? Number(rawValue).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Inertia otomatis menangani File Upload jika ada File di dalam object data
        post('/products', {
            onSuccess: () => {
                reset();
                setPriceInput('');
            },
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <Head title="Tambah Produk - Kasir Picto" />

            <div className="max-w-3xl mx-auto">
                {/* Header Navigasi */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/produk" className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition">
                            <ArrowLeft size={20} className="text-slate-600" />
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-800">Tambah Produk Baru</h1>
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
                                    type="number"
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

                        {/* Upload Gambar */}
                        <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center">
                            <ImageIcon size={40} className="text-slate-400 mb-3" />
                            <label className="cursor-pointer bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                                <Plus size={16} className="inline mr-2" /> Pilih Foto Produk
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={e => setData('image', e.target.files[0])}
                                    accept="image/*"
                                />
                            </label>
                            {data.image && <p className="mt-3 text-sm text-indigo-600 font-medium">{data.image.name}</p>}
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
                            <Save size={18} /> {processing ? 'Menyimpan...' : 'Simpan Produk'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}