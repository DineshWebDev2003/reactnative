<?php
require_once 'db.php';
header('Content-Type: application/json');

$user_id = $_GET['user_id'];

try {
    $stmt = $pdo->prepare("SELECT online_status, last_seen FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $status = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'status' => $status]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 