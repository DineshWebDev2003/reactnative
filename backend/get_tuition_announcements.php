<?php
include 'db.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT id, title, message, created_at FROM tuition_announcements WHERE is_active = 1 ORDER BY created_at DESC, id DESC");
    $announcements = $stmt->fetchAll();
    echo json_encode(['success' => true, 'announcements' => $announcements]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} 