import React from 'react';
import { MinusCircle, PlusCircle, Trash } from 'lucide-react';

export default function CartItem({ item, onIncrement, onDecrement, onRemove }) {
    return (
        <div className="bg-picto-active rounded-xl p-3 flex items-center gap-3 relative shadow-sm">
            <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 overflow-hidden">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-sm leading-none text-zinc-100">{item.name}</h4>
                <p className="text-white font-bold text-xs mt-1">
                    Rp {Number(item.price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => onDecrement(item)}><MinusCircle size={18} className='text-zinc-100' /></button>
                    <span className="text-xs font-bold text-zinc-100">{item.qty}</span>
                    <button onClick={() => onIncrement(item)}><PlusCircle size={18} className='text-zinc-100' /></button>
                </div>
            </div>
            <button 
                onClick={() => onRemove(item.id)}
                className="absolute top-2 right-2 hover:scale-110 transition-transform"
            >
                <Trash size={20} className="text-zinc-100" />
            </button>
        </div>
    );
}