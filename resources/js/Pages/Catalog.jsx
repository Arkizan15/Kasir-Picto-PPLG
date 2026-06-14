import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Search, LayoutDashboard, Loader2, CheckCircle, XCircle, Printer } from 'lucide-react';
import ProductCard from '@/Items/ProductCard';
import CartItem from '@/Items/CartItem';
import axios from 'axios';

export default function Catalog({ products = [] }) {
    const [cart, setCart] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paidAmount, setPaidAmount] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [orderStatus, setOrderStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [printerStatus, setPrinterStatus] = useState('unknown'); // 'unknown' | 'connected' | 'error'
    const printerControllerRef = useRef(null);

    const formatRupiah = (value) => {
        const digits = value.toString().replace(/\D/g, '');
        return digits ? Number(digits).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '';
    };

    const handlePaidAmountChange = (e) => {
        setPaidAmount(formatRupiah(e.target.value));
    };

    // Test printer saat halaman dimuat
    useEffect(() => {
        testPrinter();
        
        return () => {
            // Abort any pending printer test on unmount
            if (printerControllerRef.current) {
                printerControllerRef.current.abort();
            }
        };
    }, []);

    const testPrinter = async () => {
        try {
            // Cancel previous request if any
            if (printerControllerRef.current) {
                printerControllerRef.current.abort();
            }
            
            // Create new controller for this request
            const controller = new AbortController();
            printerControllerRef.current = controller;
            
            setPrinterStatus('unknown');
            // Coba endpoint API baru dulu, fallback ke web route
            const response = await axios.get('/api/printer/test', { 
                timeout: 5000,
                signal: controller.signal
            }).catch(() => axios.get('/admin/printer/test', { 
                timeout: 5000,
                signal: controller.signal
            }));

            if (response.data.success) {
                setPrinterStatus('connected');
            } else {
                setPrinterStatus('error');
            }
        } catch (error) {
            // Don't set error if request was cancelled (unmount/cleanup)
            if (error.code !== 'ECONNABORTED') {
                setPrinterStatus('error');
                console.error('Printer test failed:', error);
            }
        }
    };

    /**
     * Cetak struk via API endpoint (alternatif flow)
     * Digunakan untuk re-print atau print setelah transaksi tersimpan
     * Error handling: non-blocking (tidak menghambat flow transaksi)
     */
    const printReceiptViaApi = async (orderData) => {
        try {
            const response = await axios.post('/api/print-receipt', orderData, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (response.data.success) {
                console.log('Receipt printed via API:', response.data.invoice);
                return { success: true, message: 'Struk berhasil dicetak' };
            }
        } catch (error) {
            // Log error tapi tidak throw - agar tidak menghambat flow transaksi
            console.warn('Print via API failed (non-blocking):', error.response?.data?.message || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Gagal mencetak struk',
            };
        }
    };

    // --- LOGIKA ORDER & CETAK ---
    // Open payment modal first; actual submission happens in submitOrder
    const handleOrder = () => {
        if (cart.length === 0 || orderStatus === 'loading') return;
        setPaymentError('');
        setPaidAmount('');
        setShowPaymentModal(true);
    };

    const submitOrder = async (paidNumeric) => {
        setShowPaymentModal(false);
        setOrderStatus('loading');
        setErrorMessage('');

        try {
            const formattedItems = cart.map(item => ({
                product_id: item.id,
                name: item.name,
                qty: item.qty,
                price: item.price,
                subtotal: item.price * item.qty,
            }));

            const change = Math.max(0, paidNumeric - total);

            const payload = {
                order_id: `PICTO-${Date.now()}`,
                items: formattedItems,
                subtotal,
                total,
                paid: paidNumeric,
                change,
                cashier: "Kasir",
            };

            const response = await axios.post('/admin/orders', payload, {
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.data.success) {
                setOrderStatus('success');
                setCart([]); // Kosongkan keranjang
                setTimeout(() => setOrderStatus('idle'), 3000);
            } else {
                throw new Error(response.data.message || 'Print gagal');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Gagal memproses order.';
            setErrorMessage(message);
            setOrderStatus('error');
            setTimeout(() => setOrderStatus('idle'), 5000);
        }
    };

    // --- LOGIKA KERANJANG ---
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const removeFromCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing?.qty > 1) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty - 1 } : item);
            }
            return prev.filter(item => item.id !== product.id);
        });
    };

    const deleteFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

    // --- LOGIKA KALKULASI ---
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.qty), 0), [cart]);
    const total = subtotal;

    // --- FILTER SEARCH ---
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const getPrinterIndicator = () => {
        switch (printerStatus) {
            case 'connected':
                return { color: 'bg-green-500', message: 'Printer OK', icon: CheckCircle };
            case 'error':
                return { color: 'bg-red-500', message: 'Printer Error', icon: XCircle };
            default:
                return { color: 'bg-yellow-500', message: 'Checking...', icon: Loader2 };
        }
    };

    const printerIndicator = getPrinterIndicator();
    const PrinterIcon = printerIndicator.icon;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 font-['Poppins']">
            {/* SISI KIRI: KATALOG */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-10">
                    <div className="relative w-full max-w-md">
                        <input
                            type="text"
                            placeholder="Cari menu..."
                            className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-black shadow-[2px_2px_0px_black]"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Printer Status Indicator */}
                        <button
                            onClick={testPrinter}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black shadow-[2px_2px_0px_black] font-bold text-sm transition-all hover:brightness-95 ${
                                printerStatus === 'error' ? 'bg-red-100 text-red-700' :
                                printerStatus === 'connected' ? 'bg-green-100 text-green-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}
                            title="Klik untuk test ulang printer"
                        >
                            <PrinterIcon size={16} className={printerStatus === 'unknown' ? 'animate-spin' : ''} />
                            <span>{printerIndicator.message}</span>
                            <span className={`w-2 h-2 rounded-full ${printerIndicator.color}`}></span>
                        </button>

                        <Link
                            href="/admin"
                            className="flex items-center gap-2 bg-white border-2 border-black text-black px-6 py-3 rounded-full font-bold shadow-[2px_2px_0px_black] hover:bg-gray-100 transition-all"
                        >
                            <LayoutDashboard size={20} />
                            Admin
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                        <ProductCard 
                            key={product.id}
                            product={product}
                            onAdd={addToCart}
                            onRemove={removeFromCart}
                            quantity={cart.find(c => c.id === product.id)?.qty || 0}
                        />
                    ))}
                </div>
            </div>

            {/* SISI KANAN: SIDEBAR ORDER */}
            <div className="w-[400px] bg-picto-main p-6 flex flex-col gap-6">
                <h2 className="text-3xl font-bold text-white mb-4">Daftar<br/>Item Masuk</h2>
                
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map(item => (
                        <CartItem 
                            key={item.id} 
                            item={item} 
                            onIncrement={addToCart} 
                            onDecrement={removeFromCart}
                            onRemove={deleteFromCart}
                        />
                    ))}
                </div>

                {/* SUMMARY SECTION */}
                <div className="bg-white rounded-2xl p-6 shadow-[2px_2px_4px_0px_rgba(0,0,0,0.25)]">
                    <div className="space-y-2 mb-6 font-bold text-gray-800">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>Rp {subtotal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                        <hr className="border-gray-300" />
                        <div className="flex justify-between text-xl pt-2">
                            <span>Total :</span>
                            <span>Rp {total.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-2">
                        {/* Warning jika printer error */}
                        {printerStatus === 'error' && (
                            <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3 mb-2">
                                <p className="text-red-700 text-sm font-bold text-center">
                                    ⚠️ Printer tidak terhubung! Order tidak dapat diproses.
                                </p>
                                <p className="text-red-600 text-xs text-center mt-1">
                                    Klik indikator printer di atas untuk test ulang.
                                </p>
                            </div>
                        )}

                        <button
                            className={`w-full text-white font-bold py-4 rounded-xl text-2xl shadow-[2px_2px_4px_0px_rgba(0,0,0,0.25)] transition-all ${
                                orderStatus === 'loading' ? 'bg-gray-400 cursor-not-allowed' :
                                orderStatus === 'success' ? 'bg-green-500' :
                                orderStatus === 'error' ? 'bg-red-500' :
                                printerStatus === 'error' ? 'bg-red-400 cursor-not-allowed' :
                                'bg-[#F18C16] hover:brightness-95'
                            } ${cart.length === 0 || printerStatus === 'error' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleOrder}
                            disabled={cart.length === 0 || orderStatus === 'loading' || printerStatus === 'error'}
                        >
                            {orderStatus === 'loading' ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 size={24} className="animate-spin" />
                                    <span>Memproses...</span>
                                </div>
                            ) : orderStatus === 'success' ? (
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCircle size={24} />
                                    <span>Berhasil!</span>
                                </div>
                            ) : orderStatus === 'error' ? (
                                <div className="flex items-center justify-center gap-2">
                                    <XCircle size={24} />
                                    <span>Gagal!</span>
                                </div>
                            ) : printerStatus === 'error' ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Printer size={24} />
                                    <span>Printer Error</span>
                                </div>
                            ) : (
                                <span>Order</span>
                            )}
                        </button>

                        {orderStatus === 'error' && errorMessage && (
                            <p className="text-red-500 text-sm font-bold text-center mt-2 animate-pulse">
                                {errorMessage}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Masukkan Nominal Pembayaran</h3>
                        <div className="mb-4">
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Contoh: 50.000"
                                value={paidAmount}
                                onChange={handlePaidAmountChange}
                                className="w-full border rounded-md px-3 py-2 text-lg"
                            />
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                            <div>Total:</div>
                            <div>Rp {total.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                className="px-4 py-2 rounded bg-gray-200 font-bold text-gray-800"
                                onClick={() => { setShowPaymentModal(false); setPaymentError(''); }}
                            >
                                Batal
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-[#777164] font-bold text-gray-50"
                                onClick={() => {
                                    // Normalisasi input: ambil angka saja
                                    const numeric = parseInt((paidAmount || '').toString().replace(/[^0-9]/g, ''), 10) || 0;
                                    if (numeric < total) {
                                        setPaymentError('Nominal kurang dari total');
                                        return;
                                    }
                                    setPaymentError('');
                                    submitOrder(numeric);
                                }}
                            >
                                Konfirmasi
                            </button>
                        </div>
                        {paymentError && <p className="text-red-500 text-sm mt-3">{paymentError}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}