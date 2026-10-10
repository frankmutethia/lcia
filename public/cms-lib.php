<?php
declare(strict_types=1);

function cms_dir(): string {
    $path = getenv('MULEMBE_CMS_DATA_DIR') ?: dirname(__DIR__) . '/mulembe-cms';
    if (!is_dir($path) && !mkdir($path, 0700, true) && !is_dir($path)) throw new RuntimeException('Storage unavailable');
    $real = realpath($path);
    $root = realpath(($_SERVER['DOCUMENT_ROOT'] ?? '') ?: __DIR__) ?: realpath(__DIR__);
    if (!$real || ($root && str_starts_with(strtolower(str_replace('\\', '/', $real)) . '/', strtolower(str_replace('\\', '/', $root)) . '/'))) {
        throw new RuntimeException('CMS storage must be outside the public document root');
    }
    return $real;
}

function cms_db(): PDO {
    $db = new PDO('sqlite:' . cms_dir() . '/content.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $db->exec('PRAGMA busy_timeout=5000');
    $db->exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, role TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, password TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1)');
    $db->exec('CREATE TABLE IF NOT EXISTS content (id TEXT PRIMARY KEY, type TEXT NOT NULL, data TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, created TEXT NOT NULL)');
    $db->exec('CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, started INTEGER NOT NULL)');
    return $db;
}

function cms_user(array $row): array {
    unset($row['password']);
    $row['active'] = (bool)$row['active'];
    $row['version'] = (int)$row['version'];
    return $row;
}

function cms_items(PDO $db, bool $published): array {
    $rows = $db->query('SELECT * FROM content' . ($published ? " WHERE status='published'" : '') . ' ORDER BY created DESC')->fetchAll();
    return array_map(static function ($row) {
        $row['data'] = json_decode($row['data'], true, 512, JSON_THROW_ON_ERROR);
        $row['version'] = (int)$row['version'];
        return $row;
    }, $rows);
}
