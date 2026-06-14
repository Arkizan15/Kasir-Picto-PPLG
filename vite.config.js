import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react'; // Tambahkan ini
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            // Ubah app.js menjadi app.jsx jika kamu menggunakan React
            input: ['resources/css/app.css', 'resources/js/app.jsx'], 
            refresh: true,
        }),
        react(), // Tambahkan plugin react di sini
        tailwindcss(),
    ],
    // Jika kamu menggunakan folder 'js' untuk menyimpan file .jsx kamu
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});