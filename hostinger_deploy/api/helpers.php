<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

function jsonResponse($data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getBody(): array {
    static $body = null;
    if ($body === null) {
        $raw  = file_get_contents('php://input');
        $body = $raw ? (json_decode($raw, true) ?? []) : [];
    }
    return $body;
}

function getHeader(string $name): string {
    $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    return $_SERVER[$key] ?? '';
}

function uuid(): string {
    $data    = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function hashPwd(string $pwd): string {
    return hash('sha256', $pwd);
}

function requireAdmin(): void {
    $key = getHeader('x-admin-key');
    if (!$key || $key !== ADMIN_PASSWORD) {
        jsonResponse(['message' => 'Unauthorized'], 401);
    }
}

function requireUser(): array {
    $id = getHeader('x-user-id');
    if (!$id) jsonResponse(['message' => 'Not signed in'], 401);
    $users = getAllRows('users');
    foreach ($users as $u) {
        if (($u['id'] ?? '') === $id) {
            if (($u['status'] ?? 'active') === 'inactive') {
                jsonResponse(['message' => 'Account is deactivated.'], 403);
            }
            return $u;
        }
    }
    jsonResponse(['message' => 'Session invalid'], 401);
}

function safeUser(array $u): array {
    unset($u['passwordHash'], $u['resetToken'], $u['resetTokenExpiry']);
    return $u;
}

function normalizeRole(string $r): string {
    $roles = ['individual', 'broker', 'developer', 'admin', 'data-entry'];
    return in_array($r, $roles) ? $r : 'individual';
}

function logActivity(array $opts = []): void {
    try {
        $log   = getAllRows('activity_log');
        $entry = [
            'id'        => uuid(),
            'type'      => $opts['type']     ?? 'Access',
            'event'     => $opts['event']    ?? '',
            'subject'   => $opts['subject']  ?? '',
            'userId'    => $opts['userId']   ?? '',
            'userName'  => $opts['userName'] ?? '',
            'createdAt' => gmdate('c'),
        ];
        array_unshift($log, $entry);
        $log = array_slice($log, 0, 1000);
        replaceAll('activity_log', $log);
    } catch (Exception $e) { /* non-critical */ }
}

function deepMerge(array $base, array $override): array {
    foreach ($override as $k => $v) {
        if (is_array($v) && isset($base[$k]) && is_array($base[$k])) {
            $base[$k] = deepMerge($base[$k], $v);
        } else {
            $base[$k] = $v;
        }
    }
    return $base;
}

function slugify(string $s): string {
    return preg_replace('/[^a-z0-9]+/', '-', strtolower($s));
}

function nowIso(): string {
    return gmdate('c');
}
