<?php
require_once 'db.php';
header('Content-Type: application/json');

try {
    // Get all teachers from the database
    $stmt = $pdo->prepare("
        SELECT id, name, email, mobile, branch, role, created_at 
        FROM users 
        WHERE role = 'Teacher' OR role = 'teacher' OR role = 'TEACHER'
        ORDER BY id ASC
    ");
    
    $stmt->execute();
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug: Check what roles exist in the database
    $debugStmt = $pdo->prepare("SELECT DISTINCT role FROM users ORDER BY role");
    $debugStmt->execute();
    $roles = $debugStmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'success' => true,
        'teachers' => $teachers,
        'count' => count($teachers),
        'debug' => [
            'available_roles' => $roles,
            'query_executed' => true
        ]
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 