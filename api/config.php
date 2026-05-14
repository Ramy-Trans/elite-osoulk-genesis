<?php
// ─── Load local overrides (not committed to git) ──────────────────────────────
// On Hostinger: create api/local.php with your actual DB_PASSWORD (and DB_USER
// if different from the default).
// Example:
//   <?php
//   define('DB_PASSWORD_OVERRIDE', 'your_actual_password');
$_local = __DIR__ . '/local.php';
if (file_exists($_local)) require_once $_local;

// ─── Database ─────────────────────────────────────────────────────────────────
// IMPORTANT: When running on Hostinger shared hosting, MySQL is on the SAME
// server, so DB_HOST should be 'localhost' (not the external hostname like
// srv2116.hstgr.io — that is for remote/external connections only).
// The Replit Node.js server uses the external hostname because it is remote.
define('DB_HOST',     getenv('DB_HOST')     ?: 'localhost');
define('DB_USER',     getenv('DB_USER')     ?: 'u109248573_osoulk_user');
define('DB_PASSWORD', (defined('DB_PASSWORD_OVERRIDE') ? DB_PASSWORD_OVERRIDE : null)
                      ?? getenv('DB_PASSWORD')
                      ?: '');
define('DB_NAME',     getenv('DB_NAME')     ?: 'u109248573_hazem');
define('DB_CHARSET',  'utf8mb4');

// ─── App ──────────────────────────────────────────────────────────────────────
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: 'osoulk2026');
define('PLAN_LIMITS', ['free'=>1,'basic'=>3,'standard'=>5,'broker'=>10,'elite'=>20]);
