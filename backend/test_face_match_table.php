<?php
require_once 'db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    // Test if face_match_logs table exists and is accessible
    $stmt = $pdo->prepare("SHOW TABLES LIKE 'face_match_logs'");
    $stmt->execute();
    $tableExists = $stmt->fetch();
    
    if (!$tableExists) {
        echo json_encode([
            'success' => false, 
            'message' => 'face_match_logs table does not exist'
        ]);
        exit;
    }
    
    // Test table structure
    $stmt = $pdo->prepare("DESCRIBE face_match_logs");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test inserting a dummy record
    $testStmt = $pdo->prepare("
        INSERT INTO face_match_logs 
        (student_id, parent_id, captured_image_path, match_result, matched_parent, confidence) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $testStmt->execute([
        1, // student_id
        1, // parent_id
        'test.jpg', // captured_image_path
        json_encode(['test' => true]), // match_result
        'Test', // matched_parent
        0.00 // confidence
    ]);
    
    $insertId = $pdo->lastInsertId();
    
    // Clean up test record
    $deleteStmt = $pdo->prepare("DELETE FROM face_match_logs WHERE id = ?");
    $deleteStmt->execute([$insertId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'face_match_logs table is accessible and working',
        'table_exists' => true,
        'columns' => $columns,
        'test_insert_successful' => true
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?> 