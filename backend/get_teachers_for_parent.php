<?php
require_once 'db.php';

header('Content-Type: application/json');

if (!isset($_GET['parent_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing parent_id']);
    exit;
}

$parent_id = intval($_GET['parent_id']);

try {
    $stmt = $pdo->prepare("
        SELECT u.id, u.name, u.email, u.branch
        FROM parent_teacher_assignments pta
        JOIN users u ON pta.teacher_id = u.id
        WHERE pta.parent_id = ?
    ");
    $stmt->execute([$parent_id]);
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'teachers' => $teachers]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} 