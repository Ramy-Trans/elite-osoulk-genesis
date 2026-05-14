<?php
define('DB_HOST',     'localhost');
define('DB_USER',     'u109248573_osoulkapp');
define('DB_PASSWORD', 'ENTER_YOUR_DB_PASSWORD_HERE');
define('DB_NAME',     'u109248573_ramy');
define('DB_CHARSET',  'utf8mb4');

define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: 'osoulk2026');
define('PLAN_LIMITS', ['free'=>1,'basic'=>3,'standard'=>5,'broker'=>10,'elite'=>20]);
