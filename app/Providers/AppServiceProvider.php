<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use OpenAI\Client;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(Client::class, function (): ?Client {
            $openrouterKey = config('services.openrouter.api_key');
            $openaiKey = config('services.openai.api_key');

            if (! empty($openrouterKey)) {
                config()->set('ai.model', config('services.openrouter.model'));

                return \OpenAI::factory()
                    ->withApiKey($openrouterKey)
                    ->withBaseUri(config('services.openrouter.base_uri'))
                    ->make();
            }

            if (! empty($openaiKey)) {
                config()->set('ai.model', config('services.openai.model'));

                return \OpenAI::client($openaiKey);
            }

            return null;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiting();
    }

    /**
     * Configure named rate limiters (best practice: single place, config-driven).
     */
    protected function configureRateLimiting(): void
    {
        $attempts = config('services.analyze_throttle.attempts', 10);
        $decayMinutes = config('services.analyze_throttle.decay_minutes', 1);

        RateLimiter::for('analyze', function (Request $request) use ($attempts, $decayMinutes) {
            return Limit::perMinutes($decayMinutes, $attempts)
                ->by($request->user()?->id ?? $request->ip());
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
