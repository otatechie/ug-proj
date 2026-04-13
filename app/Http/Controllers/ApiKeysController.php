<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreApiKeysRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Redirect;

class ApiKeysController extends Controller
{
    /**
     * Store API keys in session for this browser session only.
     * Prefer .env for production.
     */
    public function store(StoreApiKeysRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if (array_key_exists('openai_key', $validated)) {
            $request->session()->put('openai_api_key', $validated['openai_key'] ? trim($validated['openai_key']) : null);
        }
        if (array_key_exists('openrouter_key', $validated)) {
            $request->session()->put('openrouter_api_key', $validated['openrouter_key'] ? trim($validated['openrouter_key']) : null);
        }

        return Redirect::route('home')->with('api_keys_saved', true);
    }
}
