<?php
require_once 'db.php';
header('Content-Type: application/json');

$staff_id = isset($_GET['staff_id']) ? intval($_GET['staff_id']) : 0;
$branch = isset($_GET['branch']) ? $_GET['branch'] : '';
$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

if (!$staff_id || !$branch) {
    echo json_encode(['success' => false, 'message' => 'Missing staff_id or branch']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT clock_in, clock_out, report FROM staff_attendance WHERE staff_id = ? AND branch = ? AND date = ?');
    $stmt->execute([$staff_id, $branch, $date]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        echo json_encode(['success' => true, 'attendance' => $row]);
    } else {
        echo json_encode(['success' => true, 'attendance' => null]);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} 