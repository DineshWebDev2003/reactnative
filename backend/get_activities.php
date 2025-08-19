<?php
require_once 'db.php';
header('Content-Type: application/json');

$branch = isset($_GET['branch']) ? $_GET['branch'] : '';
$kid_id = isset($_GET['kid_id']) ? intval($_GET['kid_id']) : 0;
$teacher_id = isset($_GET['teacher_id']) ? intval($_GET['teacher_id']) : 0;

try {
    if ($kid_id) {
        $stmt = $pdo->prepare("
            SELECT a.*, u.childName, u.child_photo
            FROM activities a
            JOIN users u ON a.kid_id = u.id
            WHERE a.kid_id = ?
            ORDER BY a.created_at DESC
        ");
        $stmt->execute([$kid_id]);
    } else if ($teacher_id) {
        // Fetch activities for all kids assigned to a specific teacher
        $stmt = $pdo->prepare("
            SELECT a.*, u.childName, u.child_photo
            FROM activities a
            JOIN users u ON a.kid_id = u.id
            WHERE a.kid_id IN (SELECT student_id FROM student_teacher_assignments WHERE teacher_id = ?)
            ORDER BY a.created_at DESC
        ");
        $stmt->execute([$teacher_id]);
    } else if ($branch) {
        // Fallback to branch if no teacher_id is provided
        $stmt = $pdo->prepare("
            SELECT a.*, u.childName, u.child_photo
            FROM activities a
            JOIN users u ON a.kid_id = u.id
            WHERE a.branch = ?
            ORDER BY a.created_at DESC
        ");
        $stmt->execute([$branch]);
    } else {
        $stmt = $pdo->query("
            SELECT a.*, u.childName, u.child_photo
            FROM activities a
            JOIN users u ON a.kid_id = u.id
            ORDER BY a.created_at DESC
        ");
    }
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'activities' => $activities]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>