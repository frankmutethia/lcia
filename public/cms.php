<?php
declare(strict_types=1);
require_once __DIR__ . '/cms-lib.php';
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header('Content-Type: application/json; charset=utf-8');

function respond(array $body, int $status = 200): never {
    http_response_code($status);
    echo json_encode($body, JSON_THROW_ON_ERROR);
    exit;
}
function fail(string $message, int $status = 422): never { respond(['ok' => false, 'message' => $message], $status); }
function field(array $data, string $key, int $max = 200, bool $required = true): string {
    $value = $data[$key] ?? '';
    if (!is_string($value) || strlen(trim($value)) > $max || ($required && trim($value) === '')) fail('Please check ' . $key . '.');
    return trim($value);
}

try {
    $db = cms_db();
    $action = $_GET['action'] ?? 'public';
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET' && $action === 'public') respond(['ok' => true, 'items' => cms_items($db, true)]);
    session_name('mulembe_staff');
    session_set_cookie_params(['httponly' => true, 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'samesite' => 'Strict', 'path' => '/']);
    ini_set('session.use_strict_mode', '1');
    session_start();
    $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
    $user = null;
    if (isset($_SESSION['uid']) && (int)($_SESSION['expires'] ?? 0) > time()) {
        $statement = $db->prepare('SELECT * FROM users WHERE id=? AND active=1');
        $statement->execute([$_SESSION['uid']]);
        $candidate = $statement->fetch();
        if ($candidate && $candidate['role'] !== 'member' && (int)$candidate['version'] === (int)($_SESSION['version'] ?? 0)) $user = $candidate;
    }
    if ($method === 'GET' && $action === 'session') respond(['ok' => true, 'user' => $user ? cms_user($user) : null, 'csrf' => $_SESSION['csrf']]);
    if ($method === 'GET' && $action === 'image') {
        $id = $_GET['id'] ?? '';
        if (!preg_match('/^[a-f0-9]{32}\.(jpg|png|webp)$/D', $id)) fail('Image not found.', 404);
        $visible = false;
        foreach (cms_items($db, !$user) as $item) if (($item['data']['image'] ?? '') === $id) $visible = true;
        $path = cms_dir() . '/' . $id;
        if (!$visible || !is_file($path)) fail('Image not found.', 404);
        $ext = pathinfo($id, PATHINFO_EXTENSION);
        header('Content-Type: image/' . ($ext === 'jpg' ? 'jpeg' : $ext));
        header('Content-Length: ' . filesize($path));
        session_write_close();
        readfile($path);
        exit;
    }
    if ($method === 'POST') {
        if (!hash_equals($_SESSION['csrf'], $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) fail('Your session expired. Refresh and sign in again.', 403);
        if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 30 * 1024 * 1024) fail('Upload at most 30 MB per batch.', 413);
    }
    $body = [];
    if ($method === 'POST' && !str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data')) {
        $body = json_decode(file_get_contents('php://input'), true);
        if (!is_array($body)) fail('Invalid request.');
    }
    if ($action === 'login' && $method === 'POST') {
        $key = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'local');
        $db->prepare('DELETE FROM attempts WHERE started < ?')->execute([time() - 900]);
        $stmt = $db->prepare('SELECT count FROM attempts WHERE key=?'); $stmt->execute([$key]);
        if ((int)$stmt->fetchColumn() >= 10) fail('Too many sign-in attempts. Please try again in 15 minutes.', 429);
        $db->prepare('INSERT INTO attempts (key,count,started) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1')->execute([$key, time()]);
        $email = strtolower(field($body, 'email', 254));
        $password = field($body, 'password', 1024);
        $stmt = $db->prepare('SELECT * FROM users WHERE email=?'); $stmt->execute([$email]); $row = $stmt->fetch();
        if (!$row || !$row['active'] || $row['role'] === 'member' || !password_verify($password, $row['password'])) fail('Email or password is incorrect, or staff access is inactive.', 401);
        $db->prepare('DELETE FROM attempts WHERE key=?')->execute([$key]);
        session_regenerate_id(true);
        $_SESSION = ['uid' => $row['id'], 'version' => (int)$row['version'], 'expires' => time() + 28800, 'csrf' => bin2hex(random_bytes(32))];
        respond(['ok' => true, 'user' => cms_user($row), 'csrf' => $_SESSION['csrf']]);
    }
    if (!$user) fail('Please sign in with a staff account.', 401);
    if ($action === 'logout' && $method === 'POST') { $_SESSION = []; session_destroy(); respond(['ok' => true]); }
    if ($action === 'content' && $method === 'GET') respond(['ok' => true, 'items' => cms_items($db, false)]);
    if ($action === 'users') {
        if ($user['role'] !== 'administrator') fail('Only administrators can manage members and roles.', 403);
        if ($method === 'GET') respond(['ok' => true, 'users' => array_map('cms_user', $db->query('SELECT * FROM users ORDER BY name')->fetchAll())]);
        if ($method !== 'POST') fail('Method not allowed.', 405);
        $name = field($body, 'name'); $email = strtolower(field($body, 'email', 254));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Enter a valid email address.');
        $role = field($body, 'role'); if (!in_array($role, ['administrator','editor','member'], true)) fail('Choose a valid role.');
        $id = field($body, 'id', 32, false);
        $password = field($body, 'password', 1024, false);
        $active = ($body['active'] ?? true) === true ? 1 : 0;
        $db->beginTransaction();
        $old = false;
        if ($id) { $stmt = $db->prepare('SELECT * FROM users WHERE id=?'); $stmt->execute([$id]); $old = $stmt->fetch(); if (!$old) fail('Member not found.', 404); }
        if ($old && (int)$old['version'] !== ($body['version'] ?? 0)) fail('This member changed. Refresh before saving.', 409);
        if ($id === $user['id'] && (!$active || $role !== 'administrator')) fail('You cannot remove your own administrator access.');
        if ($role !== 'member' && (!$old || $old['password'] === '') && $password === '') fail('A password is required for new staff access.');
        if ($password !== '' && strlen($password) < 12) fail('Use at least 12 characters for the staff password.');
        $hash = $password !== '' ? password_hash($password, PASSWORD_DEFAULT) : ($old['password'] ?? '');
        if ($old) {
            $db->prepare('UPDATE users SET name=?,email=?,role=?,active=?,password=?,version=version+1 WHERE id=?')->execute([$name,$email,$role,$active,$hash,$id]);
            if ($id === $user['id']) $_SESSION['version'] = (int)$old['version'] + 1;
        } else {
            $id = bin2hex(random_bytes(16));
            $db->prepare('INSERT INTO users (id,name,email,role,active,password) VALUES (?,?,?,?,?,?)')->execute([$id,$name,$email,$role,$active,$hash]);
        }
        $db->commit(); respond(['ok' => true]);
    }
    if ($action !== 'save' || $method !== 'POST') fail('Method not allowed.', 405);
    $body = json_decode($_POST['item'] ?? '', true);
    if (!is_array($body)) fail('Invalid content.');
    $type = field($body, 'type');
    if (!in_array($type, ['event','gallery','testimonial','category'], true)) fail('Invalid content type.');
    $status = field($body, 'status'); if (!in_array($status, ['draft','published'], true)) fail('Invalid publication status.');
    $data = ['title' => field($body, 'title', 200), 'description' => field($body, 'description', 5000, $type !== 'gallery')];
    if ($type === 'event') {
        $data['date'] = field($body, 'date');
        $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $data['date']);
        if (!$parsed || $parsed->format('Y-m-d') !== $data['date']) fail('Enter a valid event date.');
        $data['time'] = field($body, 'time', 100);
        $data['location'] = field($body, 'location', 300);
        $data['category'] = field($body, 'category', 100);
    }
    if ($type === 'testimonial') {
        $data['role'] = field($body, 'role', 100);
        if (($body['consent'] ?? false) !== true) fail('Confirm permission to publish this testimonial.');
        $data['consent'] = true;
    }
    $id = field($body, 'id', 32, false);
    $files = $_FILES['images'] ?? null;
    $pending = [];
    if ($files) {
        if (!is_array($files['tmp_name']) || count($files['tmp_name']) > ($type === 'gallery' ? 20 : 1)) fail('Select up to 20 gallery images, or one cover image.');
        foreach ($files['tmp_name'] as $i => $tmp) {
            if ($files['error'][$i] !== UPLOAD_ERR_OK || $files['size'][$i] > 5 * 1024 * 1024 || !is_uploaded_file($tmp)) fail('Each image must upload successfully and be under 5 MB.');
            $info = @getimagesize($tmp);
            $types = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
            if (!$info || !isset($types[$info['mime']]) || $info[0] * $info[1] > 40000000) fail('Use a JPEG, PNG or WebP image up to 40 megapixels.');
            $pending[] = ['tmp'=>$tmp,'name'=>bin2hex(random_bytes(16)) . '.' . $types[$info['mime']]];
        }
    }
    if ($type === 'gallery' && !$id && !$pending) fail('Select at least one gallery image.');
    if ($id && count($pending) > 1) fail('Edit one image at a time.');
    $db->beginTransaction();
    $old = false;
    if ($id) {
        $stmt = $db->prepare('SELECT * FROM content WHERE id=? AND type=?'); $stmt->execute([$id,$type]); $old = $stmt->fetch();
        if (!$old) fail('Content not found.', 404);
        if ((int)$old['version'] !== ($body['version'] ?? 0)) fail('This content changed. Refresh before saving.', 409);
        $data['image'] = json_decode($old['data'], true)['image'] ?? '';
    }
    $moved = [];
    try {
        foreach ($pending ?: [null] as $index => $image) {
            $entry = $data;
            if ($image) {
                $target = cms_dir() . '/' . $image['name'];
                if (!move_uploaded_file($image['tmp'], $target)) throw new RuntimeException('Could not save image');
                chmod($target, 0600); $moved[] = $target; $entry['image'] = $image['name'];
            }
            if (count($pending) > 1) $entry['title'] .= ' — ' . ($index + 1);
            if ($old) $db->prepare('UPDATE content SET data=?,status=?,version=version+1 WHERE id=?')->execute([json_encode($entry, JSON_THROW_ON_ERROR),$status,$id]);
            else $db->prepare('INSERT INTO content (id,type,data,status,created) VALUES (?,?,?,?,?)')->execute([bin2hex(random_bytes(16)),$type,json_encode($entry, JSON_THROW_ON_ERROR),$status,gmdate('c')]);
        }
        $db->commit();
    } catch (Throwable $error) {
        if ($db->inTransaction()) $db->rollBack();
        foreach ($moved as $path) if (is_file($path)) unlink($path);
        throw $error;
    }
    respond(['ok' => true]);
} catch (PDOException $error) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    if ($error->getCode() === '23000') fail('That email is already registered.', 409);
    error_log('Mulembe CMS database error: ' . $error->getMessage());
    fail('Content service unavailable. Check the PHP SQLite and private storage setup.', 503);
} catch (Throwable $error) {
    error_log('Mulembe CMS error: ' . $error->getMessage());
    fail('Unable to save or load content. Please try again.', 503);
}
