<?php
require_once 'db.php';

header('Content-Type: application/json');

if (!isset($_GET['teacher_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing teacher_id']);
    exit;
}

$teacher_id = intval($_GET['teacher_id']);

try {
    $stmt = $pdo->prepare("
        SELECT u.id, u.name, u.role, u.email, u.branch, u.childName, u.childClass, u.child_photo
        FROM parent_teacher_assignments pta
        JOIN users u ON pta.parent_id = u.id
        WHERE pta.teacher_id = ?
    ");
    $stmt->execute([$teacher_id]);
    $parents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'parents' => $parents]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
