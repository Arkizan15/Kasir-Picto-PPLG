import React from 'react';
import Sidebar from '@/Items/Sidebar';

export default function AdminLayout({ children, activeMenu }) {
    return (
        <div className="flex min-h-screen bg-slate-50 font-['Poppins']">
            {/* Sidebar Kiri */}
            <Sidebar activeMenu={activeMenu} />

            {/* Area Konten Utama */}
            <main className="flex-1 h-screen overflow-y-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
