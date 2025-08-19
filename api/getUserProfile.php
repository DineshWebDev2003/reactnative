<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

require_once __DIR__ . '/../backend/db.php';

$userId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($userId === 0) {
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if ($user) {
        $user['avatar'] = 'https://ui-avatars.com/api/?name=' . urlencode($user['name']);
        echo json_encode(['user' => $user]);
    } else {
        echo json_encode(['user' => null, 'error' => 'User not found.']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error fetching user profile', 'error' => $e->getMessage()]);
}
?> 