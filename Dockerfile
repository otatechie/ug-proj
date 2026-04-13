# ─── Stage 1: Install PHP dependencies ──────────────────────────────────────
FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --optimize-autoloader \
    --prefer-dist \
    --ignore-platform-reqs


# ─── Stage 2: Build frontend (needs PHP + vendor for Wayfinder) ─────────────
FROM php:8.3-cli-alpine AS frontend

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY --from=vendor /app/vendor ./vendor
COPY . .

RUN npm ci && npm run build


# ─── Stage 3: Runtime image ─────────────────────────────────────────────────
FROM php:8.3-cli-alpine AS runtime

RUN apk add --no-cache \
        libzip-dev \
        oniguruma-dev \
        icu-dev \
        sqlite-dev \
    && docker-php-ext-install \
        pdo \
        pdo_sqlite \
        mbstring \
        zip \
        intl \
        opcache \
        bcmath

WORKDIR /var/www

COPY --from=vendor /app/vendor ./vendor
COPY . .
COPY --from=frontend /app/public/build ./public/build

RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

ENV PORT=8080
EXPOSE 8080

CMD php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && php artisan serve --host=0.0.0.0 --port=$PORT
