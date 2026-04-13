<?php

use App\Http\Controllers\ApiKeysController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LogAnalysisController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/analyze', fn () => redirect()->route('home'))->name('analyze');
Route::post('/analyze', [LogAnalysisController::class, 'store'])
    ->middleware('throttle:analyze')
    ->name('analyze.store');
Route::post('/settings/api-keys', [ApiKeysController::class, 'store'])
    ->middleware('throttle:api-keys')
    ->name('settings.api-keys.store');
