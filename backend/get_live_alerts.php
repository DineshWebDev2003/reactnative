<?php
require_once 'db.php';
header('Content-Type: application/json');

try {
    // Fetch recent alerts, newest first
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $stmt = $pdo->prepare("SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?");
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $alerts = $stmt->fetchAll();
    echo json_encode(['success' => true, 'alerts' => $alerts]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 