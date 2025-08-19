<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$email_or_mobile = $data['email_or_mobile'];
$password = $data['password'];

try {
    // Authenticate parent by email or mobile and password
    $stmt = $pdo->prepare("SELECT branch, password FROM users WHERE (email = ? OR mobile = ?) AND role = 'Parent'");
    $stmt->execute([$email_or_mobile, $email_or_mobile]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user && ($user['password'] === $password || (function_exists('password_verify') && password_verify($password, $user['password'])))) {
        $branch = $user['branch'];
        // Get camera URL for branch
        $stmt2 = $pdo->prepare("SELECT camera_url FROM branches WHERE name = ?");
        $stmt2->execute([$branch]);
        $row2 = $stmt2->fetch(PDO::FETCH_ASSOC);
        if ($row2) {
            echo json_encode(['success' => true, 'camera_url' => $row2['camera_url']]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Camera not found for branch']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials or parent not found']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 