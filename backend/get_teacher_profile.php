<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Only GET method allowed']);
    exit;
}

try {
    $userId = $_GET['userId'] ?? '';

    if (empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT id, name, email, mobile, branch, profile_pic, onboarding_complete 
        FROM users 
        WHERE id = ? AND (role = 'Teacher' OR role = 'teacher')
    ");

    $stmt->execute([$userId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($teacher) {
        echo json_encode([
            'success' => true,
            'teacher' => $teacher
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 