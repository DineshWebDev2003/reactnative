<?php
require_once 'db.php';

header('Content-Type: application/json');

if (!isset($_GET['teacher_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing teacher_id']);
    exit;
}

$teacher_id = intval($_GET['teacher_id']);

try {
    // First get the teacher's branch
    $stmt = $pdo->prepare("SELECT branch FROM users WHERE id = ? AND (role = 'Teacher' OR role = 'Staff')");
    $stmt->execute([$teacher_id]);
    $teacher = $stmt->fetch();
    
    if (!$teacher) {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
        exit;
    }
    
    // Get all parents from the same branch as the teacher
    $stmt2 = $pdo->prepare("
        SELECT 
            id, 
            name, 
            role, 
            email, 
            branch, 
            childName, 
            childClass, 
            child_photo,
            father_name,
            mother_name,
            father_photo,
            mother_photo
        FROM users 
        WHERE branch = ? 
        AND role = 'Parent'
        ORDER BY childName, name
    ");
    $stmt2->execute([$teacher['branch']]);
    $parents = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'parents' => $parents]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
