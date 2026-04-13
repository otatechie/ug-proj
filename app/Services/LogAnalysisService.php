<?php

namespace App\Services;

use OpenAI\Client;
use OpenAI\Responses\Chat\CreateResponse;

class LogAnalysisService
{
    public function __construct(
        private readonly ?Client $openai
    ) {}

    /**
     * Analyze log content with ChatGPT and return structured findings.
     * When OPENAI_API_KEY is not set, returns simulated analysis for demo use.
     *
     * @return array{summary: string, risk_level: string, anomalies: array<int, string>, attack_patterns: array<int, string>, mitigations: array<int, string>, simulated?: bool}
     */
    public function analyze(string $logContent): array
    {
        if ($this->openai === null) {
            return $this->getSimulatedAnalysis($logContent);
        }

        $systemPrompt = <<<'PROMPT'
You are a cybersecurity analyst. Analyze the provided log data and respond with a valid JSON object (no markdown, no code fence) containing exactly these keys:
- "summary": A brief 1-2 sentence overview of what the logs show.
- "risk_level": One of "low", "medium", "high", or "critical".
- "anomalies": An array of strings, each describing one anomaly or suspicious finding.
- "attack_patterns": An array of strings, each describing a possible attack pattern or threat indicator.
- "mitigations": An array of strings, each describing one recommended mitigation or remediation step.

If there are no findings for a category, use an empty array. Be concise and actionable.
PROMPT;

        $userPrompt = "Analyze these logs for security threats and anomalies:\n\n<logs>\n".$logContent."\n</logs>";

        $model = config('ai.model', 'gpt-4o-mini');

        $response = $this->openai->chat()->create([
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.3,
        ]);

        $content = $this->getResponseContent($response);
        $parsed = $this->parseResponse($content);

        return [
            'summary' => $parsed['summary'] ?? 'Analysis completed.',
            'risk_level' => $parsed['risk_level'] ?? 'unknown',
            'anomalies' => $parsed['anomalies'] ?? [],
            'attack_patterns' => $parsed['attack_patterns'] ?? [],
            'mitigations' => $parsed['mitigations'] ?? [],
        ];
    }

    /**
     * Return simulated analysis when no API key is configured (for demo / development).
     *
     * @return array{summary: string, risk_level: string, anomalies: array<int, string>, attack_patterns: array<int, string>, mitigations: array<int, string>, raw_response: string, simulated: bool}
     */
    private function getSimulatedAnalysis(string $logContent): array
    {
        $isSuspicious = str_contains($logContent, 'Failed login')
            || str_contains($logContent, 'ERROR')
            || str_contains($logContent, 'OR 1=1')
            || str_contains($logContent, '.env')
            || str_contains($logContent, 'ALERT')
            || str_contains($logContent, 'brute force');

        if ($isSuspicious) {
            return [
                'summary' => 'Simulated analysis: logs indicate multiple suspicious activities including failed logins, possible SQL injection attempts, and sensitive file access. This is demo data when no API key is set.',
                'risk_level' => 'high',
                'anomalies' => [
                    'Multiple failed login attempts from the same IP in a short window.',
                    'SQL-like input detected in request (potential injection).',
                    'Access attempt to sensitive file (.env).',
                    'Unusual outbound connection to non-standard port.',
                ],
                'attack_patterns' => [
                    'Brute force / credential stuffing on authentication endpoints.',
                    'Possible SQL injection probe.',
                    'Reconnaissance for exposed configuration or secrets.',
                ],
                'mitigations' => [
                    'Enable rate limiting and lockout for failed logins; consider CAPTCHA or MFA.',
                    'Sanitize and parameterize all inputs; use WAF rules for SQL injection.',
                    'Block direct access to .env and other config files; restrict by path and role.',
                    'Monitor and restrict outbound connections; investigate unexpected ports.',
                ],
                'raw_response' => '',
                'simulated' => true,
            ];
        }

        return [
            'summary' => 'Simulated analysis: logs appear normal with routine logins and scheduled tasks. This is demo data when no API key is set.',
            'risk_level' => 'low',
            'anomalies' => [],
            'attack_patterns' => [],
            'mitigations' => [
                'Continue monitoring; no immediate action required.',
            ],
            'raw_response' => '',
            'simulated' => true,
        ];
    }

    private function getResponseContent(CreateResponse $response): string
    {
        $choice = $response->choices[0] ?? null;
        if (! $choice || ! $choice->message->content) {
            return '{}';
        }

        return $choice->message->content;
    }

    /**
     * @return array{summary?: string, risk_level?: string, anomalies?: array<int, string>, attack_patterns?: array<int, string>, mitigations?: array<int, string>}
     */
    private function parseResponse(string $content): array
    {
        $content = trim($content);
        if (preg_match('/```(?:json)?\s*([\s\S]*?)```/', $content, $m)) {
            $content = trim($m[1]);
        }
        $decoded = json_decode($content, true);
        if (! is_array($decoded)) {
            return [
                'summary' => $content,
                'risk_level' => 'unknown',
                'anomalies' => [],
                'attack_patterns' => [],
                'mitigations' => [],
            ];
        }
        foreach (['anomalies', 'attack_patterns', 'mitigations'] as $key) {
            if (isset($decoded[$key]) && ! is_array($decoded[$key])) {
                $decoded[$key] = [];
            }
        }
        return $decoded;
    }
}
