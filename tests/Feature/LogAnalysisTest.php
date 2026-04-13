<?php

use App\Services\LogAnalysisService;
use Illuminate\Support\Facades\Log;

// ── Validation ────────────────────────────────────────────────────────────────

test('rejects empty log content', function () {
    $response = $this->post(route('analyze.store'), ['log_content' => '']);

    $response->assertSessionHasErrors('log_content');
});

test('rejects missing log content', function () {
    $response = $this->post(route('analyze.store'), []);

    $response->assertSessionHasErrors('log_content');
});

test('rejects log content exceeding 50000 characters', function () {
    $response = $this->post(route('analyze.store'), [
        'log_content' => str_repeat('a', 50001),
    ]);

    $response->assertSessionHasErrors('log_content');
});

test('accepts log content at the 50000 character limit', function () {
    $service = Mockery::mock(LogAnalysisService::class);
    $service->shouldReceive('analyze')->once()->andReturn([
        'summary' => 'ok',
        'risk_level' => 'low',
        'anomalies' => [],
        'attack_patterns' => [],
        'mitigations' => [],
    ]);
    app()->instance(LogAnalysisService::class, $service);

    $response = $this->post(route('analyze.store'), [
        'log_content' => str_repeat('a', 50000),
    ]);

    $response->assertRedirect(route('home'));
    $response->assertSessionMissing('errors');
});

// ── Successful analysis ───────────────────────────────────────────────────────

test('stores analysis result in session on success', function () {
    $analysis = [
        'summary' => 'All clear.',
        'risk_level' => 'low',
        'anomalies' => [],
        'attack_patterns' => [],
        'mitigations' => ['Continue monitoring.'],
    ];

    $service = Mockery::mock(LogAnalysisService::class);
    $service->shouldReceive('analyze')->once()->with('some log content')->andReturn($analysis);
    app()->instance(LogAnalysisService::class, $service);

    $response = $this->post(route('analyze.store'), ['log_content' => 'some log content']);

    $response->assertRedirect(route('home'));
    $response->assertSessionHas('analysis');
    $response->assertSessionHas('log_content', 'some log content');
    $response->assertSessionMissing('error');

    $stored = session('analysis');
    expect($stored['summary'])->toBe('All clear.');
    expect($stored['risk_level'])->toBe('low');
    expect($stored)->toHaveKey('analyzed_at');
    expect($stored)->toHaveKey('request_id');
});

// ── Error handling ────────────────────────────────────────────────────────────

test('returns user-friendly error and logs when service throws', function () {
    Log::shouldReceive('warning')->once()->withArgs(function (string $msg, array $ctx) {
        return $msg === 'Log analysis failed'
            && isset($ctx['request_id'], $ctx['ip'], $ctx['exception'], $ctx['message']);
    });

    $service = Mockery::mock(LogAnalysisService::class);
    $service->shouldReceive('analyze')->once()->andThrow(new \RuntimeException('connection refused'));
    app()->instance(LogAnalysisService::class, $service);

    $response = $this->post(route('analyze.store'), ['log_content' => 'logs here']);

    $response->assertRedirect(route('home'));
    $response->assertSessionHas('error');
    $response->assertSessionMissing('analysis');
});

test('returns rate-limit message and logs when provider rate-limits', function () {
    Log::shouldReceive('warning')->once()->withArgs(function (string $msg) {
        return $msg === 'Log analysis rate-limited by AI provider';
    });

    $service = Mockery::mock(LogAnalysisService::class);
    $service->shouldReceive('analyze')->once()->andThrow(new \RuntimeException('rate limit exceeded'));
    app()->instance(LogAnalysisService::class, $service);

    $response = $this->post(route('analyze.store'), ['log_content' => 'logs here']);

    $response->assertRedirect(route('home'));
    $stored = $response->getSession()->get('error');
    expect($stored)->toContain('wait a minute');
});

// ── Rate limiting ─────────────────────────────────────────────────────────────

test('throttles excessive analysis requests', function () {
    $service = Mockery::mock(LogAnalysisService::class);
    $service->shouldReceive('analyze')->andReturn([
        'summary' => 'ok', 'risk_level' => 'low',
        'anomalies' => [], 'attack_patterns' => [], 'mitigations' => [],
    ]);
    app()->instance(LogAnalysisService::class, $service);

    for ($i = 0; $i < 10; $i++) {
        $this->post(route('analyze.store'), ['log_content' => 'log']);
    }

    $response = $this->post(route('analyze.store'), ['log_content' => 'log']);
    $response->assertStatus(429);
});

// ── Home page shows session data ──────────────────────────────────────────────

test('home page renders analysis from session', function () {
    $analysis = [
        'summary' => 'High risk detected.',
        'risk_level' => 'high',
        'anomalies' => ['Brute force'],
        'attack_patterns' => [],
        'mitigations' => [],
        'analyzed_at' => now()->toIso8601String(),
        'request_id' => 'test-uuid',
    ];

    $response = $this->withSession(['analysis' => $analysis])
        ->get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('home')
        ->has('analysis')
        ->where('analysis.summary', 'High risk detected.')
    );
});
