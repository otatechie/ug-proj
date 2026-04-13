<?php

namespace App\Http\Controllers;

use App\Http\Requests\AnalyzeLogRequest;
use App\Services\LogAnalysisService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;

class LogAnalysisController extends Controller
{
    public function __construct(
        private readonly LogAnalysisService $logAnalysis
    ) {}

    public function store(AnalyzeLogRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $logContent = $validated['log_content'];
        $requestId = Str::uuid()->toString();

        try {
            $result = $this->logAnalysis->analyze($logContent);
            $result['analyzed_at'] = now()->toIso8601String();
            $result['request_id'] = $requestId;

            return Redirect::route('home')->with([
                'analysis' => $result,
                'error' => null,
                'log_content' => $logContent,
            ]);
        } catch (\Throwable $e) {
            $message = $e->getMessage();
            $isRateLimit = stripos($message, 'rate limit') !== false
                || stripos($message, 'rate_limit') !== false
                || ($e instanceof \Illuminate\Http\Client\RequestException && $e->getCode() === 429);

            if ($isRateLimit) {
                $error = 'The AI provider is limiting requests. Please wait a minute and try again.';
                Log::warning('Log analysis rate-limited by AI provider', [
                    'request_id' => $requestId,
                    'ip' => $request->ip(),
                ]);
            } else {
                Log::warning('Log analysis failed', [
                    'request_id' => $requestId,
                    'ip' => $request->ip(),
                    'exception' => $e::class,
                    'message' => $message,
                ]);
                $error = app()->isProduction()
                    ? 'Analysis failed. Please try again or use a sample above.'
                    : 'Analysis failed: '.$message;
            }

            return Redirect::route('home')->with([
                'analysis' => null,
                'error' => $error,
                'log_content' => $logContent,
            ]);
        }
    }
}
