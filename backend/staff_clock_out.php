<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$staff_id = isset($data['staff_id']) ? intval($data['staff_id']) : 0;
$branch = isset($data['branch']) ? $data['branch'] : '';
$date = isset($data['date']) ? $data['date'] : date('Y-m-d');

if (!$staff_id || !$branch) {
    echo json_encode(['success' => false, 'message' => 'Missing staff_id or branch']);
    exit;
}

try {
    // Check if already clocked in today
    $stmt = $pdo->prepare('SELECT id, clock_out FROM staff_attendance WHERE staff_id = ? AND branch = ? AND date = ?');
    $stmt->execute([$staff_id, $branch, $date]);
    $row = $stmt->fetch();
    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'Not clocked in yet']);
        exit;
    }
    if ($row['clock_out']) {
        echo json_encode(['success' => false, 'message' => 'Already clocked out today']);
        exit;
    }
    // Update clock out
    $stmt = $pdo->prepare('UPDATE staff_attendance SET clock_out = CURTIME() WHERE id = ?');
    $stmt->execute([$row['id']]);
    echo json_encode(['success' => true, 'message' => 'Clocked out']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} 