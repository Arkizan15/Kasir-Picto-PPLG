import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react'; // Import icon mata

export default function Login() {
    const [showPassword, setShowPassword] = useState(false); // State untuk toggle password

    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    // Variabel shadow agar kode lebih rapi
    const shadowClass = "shadow-[2px_2px_4px_0px_rgba(0,0,0,0.25)]";

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#550154] font-['Poppins',_sans-serif]">
            <div className="bg-[#f8f9fa] w-[450px] p-10 rounded-2xl">
                <h1 className="text-4xl font-bold text-center mb-10 text-black">
                    Login
                </h1>
                
                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* Input Username */}
                    <div>
                        <label className="block text-black font-semibold mb-2">
                            Masukan Username
                        </label>
                        <input 
                            type="text" 
                            value={data.username} 
                            onChange={e => setData('username', e.target.value)} 
                            placeholder="Username....."
                            className={`w-full border border-black rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#F7AC1B] ${shadowClass}`}
                        />
                        {errors.username && (
                            <div className="text-red-500 text-sm mt-1">{errors.username}</div>
                        )}
                    </div>

                    {/* Input Password */}
                    <div>
                        <label className="block text-black font-semibold mb-2">
                            Masukan Password
                        </label>
                        <div className="relative"> {/* Container relative untuk memposisikan icon */}
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={data.password} 
                                onChange={e => setData('password', e.target.value)} 
                                placeholder="Password....."
                                className={`w-full border border-black rounded-lg p-3 pr-12 outline-none focus:ring-2 focus:ring-[#F7AC1B] ${shadowClass}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <div className="text-red-500 text-sm mt-1">{errors.password}</div>
                        )}
                    </div>

                    {/* Button Login */}
                    <div className="flex justify-center mt-6">
                        <button 
                            type="submit"
                            disabled={processing}
                            className={`bg-[#F18C16] text-white font-bold text-xl py-3 px-12 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-75 ${shadowClass}`}
                        >
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}