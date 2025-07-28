<?php
require_once 'db.php';
header('Content-Type: application/json');

$user1_id = $_GET['user1_id'] ?? null;
$user2_id = $_GET['user2_id'] ?? null;

if (!$user1_id || !$user2_id) {
    echo json_encode(['success' => false, 'message' => 'Missing user IDs']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT * FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC
    ");
    $stmt->execute([$user1_id, $user2_id, $user2_id, $user1_id]);
    $messages = $stmt->fetchAll();
    echo json_encode(['success' => true, 'messages' => $messages]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 