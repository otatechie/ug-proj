<?php

return [
    'suspicious' => <<<'LOG'
[2024-01-15 08:22:11] auth.INFO: Failed login attempt for user admin from 192.168.1.105
[2024-01-15 08:22:14] auth.INFO: Failed login attempt for user admin from 192.168.1.105
[2024-01-15 08:22:17] auth.INFO: Failed login attempt for user root from 192.168.1.105
[2024-01-15 08:22:19] auth.INFO: Failed login attempt for user administrator from 192.168.1.105
[2024-01-15 08:23:01] security.WARNING: Multiple rapid requests from 192.168.1.105 (possible brute force)
[2024-01-15 08:24:33] auth.INFO: Successful login for user admin from 192.168.1.105
[2024-01-15 08:25:02] app.ERROR: SQL syntax detected in input: ' OR 1=1 --
[2024-01-15 08:25:05] http.ACCESS: GET /wp-admin/install.php 404 from 192.168.1.105
[2024-01-15 08:25:08] http.ACCESS: GET /.env 200 from 192.168.1.105
[2024-01-15 08:26:00] security.ALERT: Unusual outbound connection to 10.0.0.99:4444 from host db-server
LOG,
    'normal' => <<<'LOG'
[2024-01-15 09:00:01] auth.INFO: User john@example.com logged in from 10.0.1.50
[2024-01-15 09:00:15] http.ACCESS: GET /api/health 200 from 10.0.1.50
[2024-01-15 09:01:22] http.ACCESS: GET /dashboard 200 from 10.0.1.50
[2024-01-15 09:05:33] auth.INFO: User jane@example.com logged in from 10.0.1.51
[2024-01-15 09:10:00] cron.INFO: Nightly backup completed successfully
[2024-01-15 09:15:44] http.ACCESS: GET /api/users 200 from 10.0.1.50
[2024-01-15 09:20:00] app.INFO: Cache cleared as scheduled
LOG,
];
