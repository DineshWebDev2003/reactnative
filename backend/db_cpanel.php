<?php
// cPanel Database Connection Configuration
// This is for your remote cPanel hosting

$host = 'localhost'; // Usually 'localhost' for cPanel
$db   = 'tnhappyki_mobileapp';
$user = 'tnhappyki_happyapp';
$pass = 'ybEtYp2@D@#U';
$charset = 'utf8mb4';
$port = 3306; // Standard MySQL port for cPanel

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed',
        'error'   => $e->getMessage()
    ]);
    exit;
}
?> 