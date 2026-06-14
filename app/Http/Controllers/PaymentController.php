<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function showStatus(Request $request)
    {
        // Logika sederhana: ambil status dari query string, misal: ?status=success
        $status = $request->query('status');

        if ($status === 'success') {
            return Inertia::render('OrderSuccess');
        }

        return Inertia::render('OrderFail');
    }
}