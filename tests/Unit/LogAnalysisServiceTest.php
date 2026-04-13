<?php

use App\Services\LogAnalysisService;

// ── Simulated analysis (no API key) ──────────────────────────────────────────

test('returns simulated low-risk result for benign logs', function () {
    $service = new LogAnalysisService(null);

    $result = $service->analyze('INFO: User logged in successfully. Cron job ran at 03:00.');

    expect($result['simulated'])->toBeTrue();
    expect($result['risk_level'])->toBe('low');
    expect($result['anomalies'])->toBeEmpty();
    expect($result['attack_patterns'])->toBeEmpty();
});

test('returns simulated high-risk result when failed login detected', function () {
    $service = new LogAnalysisService(null);

    $result = $service->analyze('Failed login for user admin from 10.0.0.1');

    expect($result['simulated'])->toBeTrue();
    expect($result['risk_level'])->toBe('high');
    expect($result['anomalies'])->not->toBeEmpty();
    expect($result['attack_patterns'])->not->toBeEmpty();
    expect($result['mitigations'])->not->toBeEmpty();
});

test('returns simulated high-risk result when SQL injection pattern detected', function () {
    $service = new LogAnalysisService(null);

    $result = $service->analyze("GET /search?q=' OR 1=1--");

    expect($result['simulated'])->toBeTrue();
    expect($result['risk_level'])->toBe('high');
});

test('returns simulated high-risk result when .env access detected', function () {
    $service = new LogAnalysisService(null);

    $result = $service->analyze('GET /.env HTTP/1.1 200');

    expect($result['risk_level'])->toBe('high');
});

test('returns simulated high-risk result when ALERT keyword present', function () {
    $service = new LogAnalysisService(null);

    $result = $service->analyze('ALERT: intrusion detected on host db-01');

    expect($result['risk_level'])->toBe('high');
});

test('simulated result always includes required keys', function () {
    $service = new LogAnalysisService(null);

    $result = $service->analyze('anything');

    foreach (['summary', 'risk_level', 'anomalies', 'attack_patterns', 'mitigations', 'simulated'] as $key) {
        expect($result)->toHaveKey($key);
    }
    expect($result['anomalies'])->toBeArray();
    expect($result['attack_patterns'])->toBeArray();
    expect($result['mitigations'])->toBeArray();
});
