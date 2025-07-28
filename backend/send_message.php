<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$sender_id = $data['sender_id'] ?? null;
$receiver_id = $data['receiver_id'] ?? null;
$message = $data['message'] ?? '';

if (!$sender_id || !$receiver_id || !$message) {
    echo json_encode(['success' => false, 'message' => 'Missing sender, receiver, or message content']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (?, ?, ?, NOW())");
    $stmt->execute([$sender_id, $receiver_id, $message]);
    
    echo json_encode(['success' => true, 'message_id' => $pdo->lastInsertId()]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 