<?php

// ── API key storage ───────────────────────────────────────────────────────────

test('stores openrouter key in session', function () {
    $response = $this->post(route('settings.api-keys.store'), [
        'openrouter_key' => 'sk-or-v1-test123',
    ]);

    $response->assertRedirect(route('home'));
    $response->assertSessionHas('api_keys_saved', true);
    expect(session('openrouter_api_key'))->toBe('sk-or-v1-test123');
});

test('stores openai key in session', function () {
    $response = $this->post(route('settings.api-keys.store'), [
        'openai_key' => 'sk-test456',
    ]);

    $response->assertRedirect(route('home'));
    expect(session('openai_api_key'))->toBe('sk-test456');
});

test('clears key when empty string submitted', function () {
    $this->withSession(['openrouter_api_key' => 'sk-or-old'])
        ->post(route('settings.api-keys.store'), [
            'openrouter_key' => '',
        ]);

    expect(session('openrouter_api_key'))->toBeNull();
});

test('trims whitespace from stored keys', function () {
    $this->post(route('settings.api-keys.store'), [
        'openai_key' => '  sk-spaced  ',
    ]);

    expect(session('openai_api_key'))->toBe('sk-spaced');
});

test('rejects keys longer than 512 characters', function () {
    $response = $this->post(route('settings.api-keys.store'), [
        'openai_key' => str_repeat('x', 513),
    ]);

    $response->assertSessionHasErrors('openai_key');
});

test('rate-limits excessive api key submissions', function () {
    for ($i = 0; $i < 10; $i++) {
        $this->post(route('settings.api-keys.store'), ['openai_key' => 'sk-test']);
    }

    $response = $this->post(route('settings.api-keys.store'), ['openai_key' => 'sk-test']);
    $response->assertRedirect(route('home'));
});
