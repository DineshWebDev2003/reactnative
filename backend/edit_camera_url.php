<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? null;
$camera_url = $data['camera_url'] ?? null;

if (!$id) {
    echo json_encode(['success' => false, 'message' => 'Branch ID required']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE branches SET camera_url = ? WHERE id = ?");
    $result = $stmt->execute([$camera_url, $id]);
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update camera URL']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 