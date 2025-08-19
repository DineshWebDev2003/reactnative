<?php
require_once 'db.php';
header('Content-Type: application/json');

$student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;
$date = date('Y-m-d');

if (!$student_id) {
    echo json_encode(['success' => false, 'message' => 'Missing student_id']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT status FROM attendance WHERE student_id = ? AND date = ?");
    $stmt->execute([$student_id, $date]);
    $record = $stmt->fetch();

    if ($record && $record['status'] === 'present') {
        echo json_encode(['success' => true, 'status' => 'present']);
    } else {
        echo json_encode(['success' => true, 'status' => 'absent']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 