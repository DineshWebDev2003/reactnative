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
    $stmt = $pdo->prepare('SELECT id FROM staff_attendance WHERE staff_id = ? AND branch = ? AND date = ?');
    $stmt->execute([$staff_id, $branch, $date]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Already clocked in today']);
        exit;
    }
    // Insert clock in
    $stmt = $pdo->prepare('INSERT INTO staff_attendance (staff_id, branch, date, clock_in) VALUES (?, ?, ?, CURTIME())');
    $stmt->execute([$staff_id, $branch, $date]);
    echo json_encode(['success' => true, 'message' => 'Clocked in']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} 