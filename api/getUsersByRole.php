<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');
header('Content-Type: application/json');

require_once __DIR__ . '/../backend/db.php';

$role = isset($_GET['role']) ? trim($_GET['role']) : '';

if ($role === '') {
    echo json_encode(['success' => false, 'message' => 'Role is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE role = ?");
    $stmt->execute([$role]);
    $users = $stmt->fetchAll();

    foreach ($users as &$user) {
        $user['avatar'] = 'https://ui-avatars.com/api/?name=' . urlencode($user['name']);
    }

    echo json_encode(['users' => $users]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error fetching users', 'error' => $e->getMessage()]);
}
?> 