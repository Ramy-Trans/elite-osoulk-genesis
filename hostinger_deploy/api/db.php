<?php
require_once __DIR__ . '/config.php';

function getPdo(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET . ';connect_timeout=10';
        $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => 10,
        ]);
    }
    return $pdo;
}

function testDbConnection(): array {
    try {
        $pdo = getPdo();
        $pdo->query('SELECT 1');
        return ['ok' => true, 'host' => DB_HOST, 'db' => DB_NAME, 'user' => DB_USER];
    } catch (PDOException $e) {
        return [
            'ok'    => false,
            'host'  => DB_HOST,
            'db'    => DB_NAME,
            'user'  => DB_USER,
            'error' => $e->getMessage(),
            'hint'  => DB_HOST === 'localhost' || DB_HOST === '127.0.0.1'
                ? 'Using localhost — correct for Hostinger PHP (same server). Check DB_USER and DB_PASSWORD.'
                : 'Using remote host. If this is a Hostinger PHP app, try DB_HOST=localhost instead.',
        ];
    }
}

function getAllRows(string $table): array {
    $pdo  = getPdo();
    $stmt = $pdo->query("SELECT data FROM `$table` ORDER BY created_at ASC");
    $rows = [];
    while ($row = $stmt->fetch()) {
        $rows[] = json_decode($row['data'], true);
    }
    return $rows;
}

function getRow(string $table, string $id): ?array {
    $pdo  = getPdo();
    $stmt = $pdo->prepare("SELECT data FROM `$table` WHERE id = ?");
    $stmt->execute([$id]);
    $row  = $stmt->fetch();
    return $row ? json_decode($row['data'], true) : null;
}

function insertRow(string $table, array $data): void {
    $pdo  = getPdo();
    $stmt = $pdo->prepare("INSERT INTO `$table` (id, data) VALUES (?, ?)");
    $stmt->execute([$data['id'], json_encode($data, JSON_UNESCAPED_UNICODE)]);
}

function updateRow(string $table, array $data): void {
    $pdo  = getPdo();
    $stmt = $pdo->prepare("UPDATE `$table` SET data = ? WHERE id = ?");
    $stmt->execute([json_encode($data, JSON_UNESCAPED_UNICODE), $data['id']]);
}

function deleteRow(string $table, string $id): void {
    $pdo  = getPdo();
    $stmt = $pdo->prepare("DELETE FROM `$table` WHERE id = ?");
    $stmt->execute([$id]);
}

function replaceAll(string $table, array $rows): void {
    $pdo = getPdo();
    $pdo->beginTransaction();
    try {
        $pdo->exec("DELETE FROM `$table`");
        $stmt = $pdo->prepare("INSERT INTO `$table` (id, data) VALUES (?, ?)");
        foreach ($rows as $r) {
            $stmt->execute([$r['id'], json_encode($r, JSON_UNESCAPED_UNICODE)]);
        }
        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function getKv(string $name, $default = []) {
    $pdo  = getPdo();
    $stmt = $pdo->prepare("SELECT data FROM kv_store WHERE name = ?");
    $stmt->execute([$name]);
    $row  = $stmt->fetch();
    return $row ? json_decode($row['data'], true) : $default;
}

function setKv(string $name, $value): void {
    $pdo  = getPdo();
    $json = json_encode($value, JSON_UNESCAPED_UNICODE);
    $stmt = $pdo->prepare("INSERT INTO kv_store (name, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?");
    $stmt->execute([$name, $json, $json]);
}

function getViewCount(string $propertyId): int {
    $pdo  = getPdo();
    $stmt = $pdo->prepare("SELECT view_count FROM property_views WHERE property_id = ?");
    $stmt->execute([$propertyId]);
    $row  = $stmt->fetch();
    return $row ? (int)$row['view_count'] : 0;
}

function incrementView(string $propertyId): int {
    $pdo  = getPdo();
    $stmt = $pdo->prepare(
        "INSERT INTO property_views (property_id, view_count) VALUES (?, 1)
         ON DUPLICATE KEY UPDATE view_count = view_count + 1"
    );
    $stmt->execute([$propertyId]);
    return getViewCount($propertyId);
}

function getAllViews(): array {
    $pdo  = getPdo();
    $stmt = $pdo->query("SELECT property_id, view_count FROM property_views");
    $out  = [];
    while ($row = $stmt->fetch()) {
        $out[$row['property_id']] = (int)$row['view_count'];
    }
    return $out;
}
