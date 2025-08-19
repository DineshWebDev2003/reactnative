<?php
include 'db.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->prepare("SELECT id, name, branch, profile_image, mobile, last_seen, online_status FROM users WHERE role='Franchisee'");
    $stmt->execute();
    $franchisees = $stmt->fetchAll();
    echo json_encode(['success' => true, 'franchisees' => $franchisees]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 