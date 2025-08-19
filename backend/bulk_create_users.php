<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 1. Include your PDO connection
require_once 'db.php'; // This should define $pdo

if (!isset($_FILES['file'])) {
    echo json_encode(['success' => false, 'message' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file']['tmp_name'];
$results = [];
$all_success = true;

if (($handle = fopen($file, 'r')) !== false) {
    $row = 0;
    while (($data = fgetcsv($handle, 1000, ',')) !== false) {
        if ($row++ === 0) continue; // skip header
        $name = $data[0] ?? '';
        $childName = $data[1] ?? '';
        $email = $data[2] ?? '';
        $mobile = $data[3] ?? '';
        $branch = $data[4] ?? '';
        $password = $data[5] ?? '';
        $role = $data[6] ?? 'Parent';

        if (!$email || !$mobile || !$branch || !$password || (!$name && !$childName)) {
            $results[] = ['email' => $email, 'success' => false, 'message' => 'Missing required fields'];
            $all_success = false;
            continue;
        }

        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $results[] = ['email' => $email, 'success' => false, 'message' => 'Email already exists'];
            $all_success = false;
            continue;
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        try {
            if (strtolower($role) === 'parent') {
                $stmt = $pdo->prepare("INSERT INTO users (childName, email, mobile, branch, password, role) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$childName, $email, $mobile, $branch, $hashedPassword, $role]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO users (name, email, mobile, branch, password, role) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$name, $email, $mobile, $branch, $hashedPassword, $role]);
            }
            $results[] = ['email' => $email, 'success' => true];
        } catch (PDOException $e) {
            $results[] = ['email' => $email, 'success' => false, 'message' => $e->getMessage()];
            $all_success = false;
        }
    }
    fclose($handle);
    file_put_contents(__DIR__ . '/debug_bulk_upload.txt', json_encode($results, JSON_PRETTY_PRINT));
    echo json_encode(['success' => $all_success, 'results' => $results]);
} else {
    file_put_contents(__DIR__ . '/debug_bulk_upload.txt', 'Failed to read CSV file');
    echo json_encode(['success' => false, 'message' => 'Failed to read CSV file']);
} 