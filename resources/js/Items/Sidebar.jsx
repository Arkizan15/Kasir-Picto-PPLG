import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, Package, ShoppingCart, LogOut } from 'lucide-react';

export default function Sidebar({ activeMenu }) {
    const { url } = usePage();

    const menuItems = [
        {
            name: 'Dashboard',
            icon: <LayoutDashboard size={20} />,
            href: '/admin',
            active: activeMenu === 'dashboard' || url === '/admin',
        },
        {
            name: 'Produk',
            icon: <Package size={20} />,
            href: '/admin/produk',
            active: activeMenu === 'produk' || url.startsWith('/admin/produk') || url.startsWith('/products'),
        },
        {
            name: 'Penjualan',
            icon: <ShoppingCart size={20} />,
            href: '/admin/penjualan',
            active: activeMenu === 'penjualan' || url.startsWith('/admin/penjualan'),
        },
    ];

    return (
        <aside className="w-64 bg-[#550154] flex flex-col min-h-screen font-['Poppins']">
            {/* Logo Area */}
            <div className="p-6">
                <div className="w-full  rounded-xl flex items-center justify-center">
                    <img src="/images/logo.png" alt="PICTO POS" className="h-17" />
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-6 space-y-3">
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                            item.active
                                ? 'bg-picto-active text-white shadow-[3px_3px_3px_rgba(0,0,0,0.25)]'
                                : 'bg-picto-inactive text-white hover:bg-picto-active/80 hover:shadow-[3px_3px_3px_rgba(0,0,0,0.25)]'
                        }`}
                    >
                        {item.icon}
                        {item.name}
                    </Link>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="p-4 mt-auto">
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="w-full flex items-center justify-center gap-2 bg-picto-inactive text-white px-4 py-3 rounded-xl hover:bg-picto-active transition-all font-semibold shadow-[3px_3px_3px_rgba(0,0,0,0.25)]"
                >
                    <LogOut size={20} />
                    Logout
                </Link>
            </div>
        </aside>
    );
}
