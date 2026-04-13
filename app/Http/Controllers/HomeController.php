<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('home', [
            'sampleLogs' => config('sample_logs'),
            'activeTab' => null,
            'analysis' => session('analysis'),
            'error' => session('error'),
            'initialLogContent' => session('log_content'),
        ]);
    }
}
