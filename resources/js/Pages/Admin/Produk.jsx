import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';

export default function Produk({ products = [], activityLogs = [] }) {
    const { delete: destroy } = useForm();
    
    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
            destroy(`/products/${id}`);
        }
    };

    return (
        <AdminLayout activeMenu="produk">
            <Head title="Kelola Produk - Kasir Picto" />

            {/* Header Area */}
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Daftar Produk</h1>
                    <p className="text-slate-500 mt-1">Kelola inventaris dan konfigurasi stok.</p>
                </div>
                <Link
                    href="/products/create"
                    className="flex items-center gap-2 bg-picto-main hover:bg-picto-sub text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[3px_3px_3px_rgba(0,0,0,0.25)]"
                >
                    <Plus size={18} /> Tambah Produk
                </Link>
            </header>

            {/* Product Table */}
            <div className="bg-white rounded-2xl shadow-[3px_3px_3px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden mb-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-picto-main text-white">
                                <th className="p-4 font-semibold text-sm">Produk</th>
                                <th className="p-4 font-semibold text-sm">Harga</th>
                                <th className="p-4 font-semibold text-sm text-center">Stok</th>
                                <th className="p-4 font-semibold text-sm text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        <Package size={48} className="mx-auto mb-3 opacity-20" />
                                        Belum ada produk.
                                    </td>
                                </tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                                                        <Package size={20} className="text-slate-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-slate-800">{product.name}</p>
                                                    <p className="text-xs text-slate-500">{product.category?.name || 'Tanpa Kategori'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-700">
                                            Rp {Number(product.price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link href={`/products/${product.id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                    <Edit2 size={18} />
                                                </Link>
                                                <button onClick={() => handleDelete(product.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Activity Logs */}
            <div className="bg-white rounded-2xl shadow-[3px_3px_3px_rgba(0,0,0,0.1)] border border-slate-100 p-6">
                <h3 className="text-xl font-bold mb-6 text-slate-800">Log Aktivitas Terbaru</h3>
                <div className="space-y-4">
                    {activityLogs.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">Belum ada aktivitas.</p>
                    ) : (
                        activityLogs.map(log => (
                            <div key={log.id} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className={`w-2 h-full min-h-[40px] rounded-full ${
                                    log.action === 'create' ? 'bg-emerald-500' : 
                                    log.action === 'update' ? 'bg-blue-500' : 'bg-rose-500'
                                }`} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-slate-800">{log.user}</p>
                                        <span className="text-xs font-semibold text-slate-500">{log.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{log.description}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
