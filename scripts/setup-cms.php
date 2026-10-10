<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/public/cms-lib.php';
$email = strtolower($argv[1] ?? '');
$name = $argv[2] ?? '';
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || trim($name) === '') exit("Usage: php scripts/setup-cms.php email 'Full name'\nSet MULEMBE_CMS_DATA_DIR to the private storage directory.\n");
fwrite(STDOUT, "Enter the initial administrator password (at least 12 characters; terminal may echo input): ");
$password = trim(fgets(STDIN));
if (strlen($password) < 12) exit("Password must contain at least 12 characters.\n");
$db = cms_db();
if ((int)$db->query('SELECT COUNT(*) FROM users')->fetchColumn() !== 0) exit("Setup already completed. Use User management to add accounts.\n");
$db->prepare('INSERT INTO users (id,name,email,role,password) VALUES (?,?,?,?,?)')->execute([bin2hex(random_bytes(16)),trim($name),$email,'administrator',password_hash($password,PASSWORD_DEFAULT)]);
echo "Administrator created. Private storage: " . cms_dir() . "\n";
