<?php
return [
    // Connector type: 'server' for HTTP-based network printing (Distributed Stand Architecture)
    // This Laravel server acts as Central Brain, delegating print commands to client laptops
    'connector' => env('PRINTER_CONNECTOR', 'server'),
    
    // Target printer client URL (FastAPI Python script on client laptop)
    'printer_server_url' => env('PRINTER_SERVER_URL', 'http://localhost:9000'),
    
    // Printer ID for multi-printer setups (1 for PPLG stand, 2 for DKV stand, etc.)
    'printer_id' => (int) env('PRINTER_ID', 1),
    
    // Paper width configuration for client-side formatting
    // DKV Xprinter 58mm: 32 chars per line
    // PPLG Epson 80mm: 48 chars per line
    'chars_per_line' => (int) env('PRINTER_CHARS_PER_LINE', 32),
];