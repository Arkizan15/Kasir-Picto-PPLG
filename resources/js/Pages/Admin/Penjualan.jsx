import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FileDown, Calendar, Receipt, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import axios from 'axios';

export default function Penjualan() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        fetchAvailableDates();
        fetchTodayHistory();
    }, []);

    const fetchAvailableDates = async () => {
        try {
            const response = await axios.get('/admin/orders/dates');
            setAvailableDates(response.data);
            // Set default ke hari ini jika ada
            const today = new Date().toISOString().split('T')[0];
            if (response.data.includes(today)) {
                setSelectedDate(today);
            } else if (response.data.length > 0) {
                setSelectedDate(response.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch dates:', error);
        }
    };

    const fetchTodayHistory = async (date = '') => {
        setLoading(true);
        try {
            const url = date ? `/admin/orders/today?date=${date}` : '/admin/orders/today';
            const response = await axios.get(url);
            setTransactions(response.data);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (e) => {
        const date = e.target.value;
        setSelectedDate(date);
        fetchTodayHistory(date);
    };

    const handleExport = () => {
        const query = selectedDate ? `?date=${selectedDate}` : '';
        window.location.href = `/admin/export/today${query}`;
    };

    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    // Format tanggal untuk display
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <AdminLayout activeMenu="penjualan">
            <Head title="Riwayat Penjualan - Kasir Picto" />

            <header className="mb-8 flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Riwayat Penjualan</h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <Calendar size={16} /> {selectedDate ? formatDate(selectedDate) : 'Pilih tanggal'}
                    </p>
                </div>
                <div className="flex gap-3">
                    {/* Filter Tanggal */}
                    <div className="relative">
                        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedDate}
                            onChange={handleDateChange}
                            className="pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-picto-main outline-none cursor-pointer"
                        >
                            {availableDates.length === 0 && (
                                <option value="">Tidak ada data</option>
                            )}
                            {availableDates.map(date => (
                                <option key={date} value={date}>
                                    {formatDate(date)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[3px_3px_3px_rgba(0,0,0,0.25)]"
                    >
                        <FileDown size={18} /> Export Excel
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-2xl shadow-[3px_3px_3px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-picto-main text-white">
                                <th className="p-4 font-semibold text-sm">Waktu</th>
                                <th className="p-4 font-semibold text-sm">Invoice</th>
                                <th className="p-4 font-semibold text-sm">Kasir</th>
                                <th className="p-4 font-semibold text-sm text-right">Total Bayar</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">Memuat data...</td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        <Receipt size={48} className="mx-auto mb-3 opacity-20" />
                                        Belum ada transaksi hari ini.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map(trx => (
                                    <React.Fragment key={trx.id}>
                                        <tr 
                                            className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedRow === trx.id ? 'bg-slate-50' : ''}`}
                                            onClick={() => toggleRow(trx.id)}
                                        >
                                            <td className="p-4 font-medium text-slate-700">{trx.created_at}</td>
                                            <td className="p-4 font-bold text-indigo-600">{trx.id}</td>
                                            <td className="p-4 text-slate-600">{trx.cashier}</td>
                                            <td className="p-4 text-right font-bold text-emerald-600">
                                                Rp {Number(trx.total_price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="p-4 text-right text-slate-400">
                                                {expandedRow === trx.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </td>
                                        </tr>
                                        {/* Expandable Detail Row */}
                                        {expandedRow === trx.id && (
                                            <tr className="bg-slate-50 border-t-0">
                                                <td colSpan="5" className="p-4">
                                                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-inner">
                                                        <h4 className="font-bold text-sm text-slate-500 mb-3 uppercase tracking-wider">Detail Item</h4>
                                                        <div className="space-y-2">
                                                            {trx.items.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                                    <div className="flex-1">
                                                                        <span className="font-semibold text-slate-800">{item.product_name}</span>
                                                                        <span className="text-slate-500 ml-2">x{item.quantity}</span>
                                                                    </div>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="font-medium text-slate-700">Rp {Number(item.subtotal).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                                                        {Number(item.discount) > 0 && (
                                                                            <span className="text-xs text-picto-sub font-semibold">
                                                                                Diskon: -Rp {Number(item.discount).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <hr className="my-3 border-slate-200" />
                                                        <div className="flex justify-end text-sm">
                                                            <span className="font-bold text-slate-700">Total: Rp {Number(trx.total_price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
