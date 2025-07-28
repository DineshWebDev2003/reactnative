<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$staff_id = isset($data['staff_id']) ? intval($data['staff_id']) : 0;
$branch = isset($data['branch']) ? $data['branch'] : '';
$date = isset($data['date']) ? $data['date'] : date('Y-m-d');
$report = isset($data['report']) ? $data['report'] : '';
$submitted_to = isset($data['submitted_to']) ? $data['submitted_to'] : 'both';

if (!$staff_id || !$branch || !$report) {
    echo json_encode(['success' => false, 'message' => 'Missing staff_id, branch, or report']);
    exit;
}

try {
    // Check if attendance record exists for today
    $stmt = $pdo->prepare('SELECT id FROM staff_attendance WHERE staff_id = ? AND branch = ? AND date = ?');
    $stmt->execute([$staff_id, $branch, $date]);
    $row = $stmt->fetch();
    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'No attendance record for today']);
        exit;
    }
    // Update report and submitted_to
    $stmt = $pdo->prepare('UPDATE staff_attendance SET report = ?, submitted_to = ? WHERE id = ?');
    $stmt->execute([$report, $submitted_to, $row['id']]);
    echo json_encode(['success' => true, 'message' => 'Report submitted']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} 