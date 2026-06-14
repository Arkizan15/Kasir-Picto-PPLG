import React from 'react';
import { MinusCircle, PlusCircle } from 'lucide-react';

export default function ProductCard({ product, onAdd, onRemove, quantity = 0 }) {
    const shadowClass = "shadow-[2px_2px_4px_0px_rgba(0,0,0,0.25)]";

    return (
        <div className={`bg-white rounded-2xl p-4 flex flex-col gap-2 ${shadowClass}`}>
            <img src={product.image_url} alt={product.name} className="w-full h-40 object-contain" />
            <div className="mt-2">
                <h3 className="font-bold text-lg">{product.name}</h3>
                <p className="text-[#5C4637] font-bold text-md">
                    Rp {Number(product.price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
            </div>
            <div className="flex items-center justify-end gap-3 mt-auto">
                <button onClick={() => onRemove(product)} className="text-black">
                    <MinusCircle size={24} />
                </button>
                <span className="font-bold">{quantity === 0 ? '0' : quantity}</span>
                <button onClick={() => onAdd(product)} className="text-black">
                    <PlusCircle size={24} />
                </button>
            </div>
        </div>
    );
}