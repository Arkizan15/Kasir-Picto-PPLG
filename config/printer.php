<?php
return [
    // Gunakan 'windows' untuk shared printer (POS58) atau 'file' untuk COM port
    'connector' => env('PRINTER_CONNECTOR', 'windows'),
    
    // Nama printer: POS58 (Windows shared) atau COM7 (Bluetooth)
    'printer_name' => env('PRINTER_NAME', 'POS58'),
    
    'store_name' => env('PRINTER_STORE_NAME', 'PICTOGRAFEST 8'),
    'store_address' => env('PRINTER_STORE_ADDRESS', 'SMKN 1 Banyuwangi'),
    'footer_message' => env('PRINTER_FOOTER_MESSAGE', 'Terima Kasih Atas Kunjungan Anda!'),
    'chars_per_line' => env('PRINTER_CHARS_PER_LINE', 32),
];