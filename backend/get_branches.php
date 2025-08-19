<?php
require_once 'db.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT id, name, address, camera_url FROM branches");
    $branches = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'branches' => $branches
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'message' => 'Query failed', 
        'error' => $e->getMessage()
    ]);
}
?> 