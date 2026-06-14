import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Package, ShoppingCart, TrendingUp, AlertTriangle, ArrowRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

export default function AdminDashboard({ todayRevenue = 0, todayTransactions = 0, chartData = [] }) {
    
    // Custom Tooltip untuk Recharts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-xl shadow-[3px_3px_3px_rgba(0,0,0,0.25)] border border-slate-100">
                    <p className="font-bold text-slate-800 mb-1">{label}</p>
                    <p className="text-picto-main font-semibold">
                        Rp {payload[0].value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <AdminLayout activeMenu="dashboard">
            <Head title="Dashboard - Kasir Picto" />

            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Ringkasan Bisnis</h1>
                    <p className="text-slate-500 mt-1">Pantau performa penjualan hari ini.</p>
                </div>
                <Link
                    href="/catalog"
                    className="flex items-center gap-2 bg-picto-main hover:bg-picto-sub text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[3px_3px_3px_rgba(0,0,0,0.25)]"
                >
                    Buka Kasir <ArrowRight size={18} />
                </Link>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard 
                    title="Pendapatan Hari Ini" 
                    value={`Rp ${todayRevenue.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                    icon={<TrendingUp className="text-white" size={28} />} 
                    color="bg-emerald-500"
                />
                <StatCard 
                    title="Transaksi Hari Ini" 
                    value={todayTransactions} 
                    icon={<ShoppingCart className="text-white" size={28} />} 
                    color="bg-blue-500"
                />
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 gap-8 mb-8">
                
                {/* Grafik Recharts */}
                <div className="bg-white p-6 rounded-2xl shadow-[3px_3px_3px_rgba(0,0,0,0.1)] border border-slate-100">
                    <h3 className="text-xl font-bold mb-6 text-slate-800">Tren Penjualan (7 Hari)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#A60704" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#A60704" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#550154', fontSize: 12, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#550154', fontSize: 12 }}
                                    tickFormatter={(value) => `Rp${value / 1000}k`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#F71B05', strokeWidth: 2, strokeDasharray: '4 4' }} />
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="#550154" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorTotal)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function StatCard({ title, value, icon, color }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-[3px_3px_3px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${color} shadow-lg`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-500 mb-1">{title}</p>
                <h4 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h4>
            </div>
        </div>
    );
}