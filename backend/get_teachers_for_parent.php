<?php
require_once 'db.php';

header('Content-Type: application/json');

if (!isset($_GET['parent_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing parent_id']);
    exit;
}

$parent_id = intval($_GET['parent_id']);

try {
    // First, get the parent's branch
    $parent_stmt = $pdo->prepare("SELECT branch FROM users WHERE id = ? AND role = 'Parent'");
    $parent_stmt->execute([$parent_id]);
    $parent = $parent_stmt->fetch();
    
    if (!$parent) {
        echo json_encode(['success' => false, 'message' => 'Parent not found']);
        exit;
    }
    
    // Try to get assigned teachers first
    $stmt = $pdo->prepare("
        SELECT u.id, u.name, u.email, u.branch, u.role, u.mobile
        FROM parent_teacher_assignments pta
        JOIN users u ON pta.teacher_id = u.id
        WHERE pta.parent_id = ?
    ");
    $stmt->execute([$parent_id]);
    $assigned_teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // If no assigned teachers, get teachers from the same branch
    if (empty($assigned_teachers)) {
        $stmt2 = $pdo->prepare("
            SELECT id, name, email, branch, role, mobile
            FROM users 
            WHERE branch = ? AND (role = 'Teacher' OR role = 'Staff')
        ");
        $stmt2->execute([$parent['branch']]);
        $branch_teachers = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'teachers' => $branch_teachers, 'source' => 'branch']);
    } else {
        echo json_encode(['success' => true, 'teachers' => $assigned_teachers, 'source' => 'assigned']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} 