<?php
require_once 'db.php';
header('Content-Type: application/json');

$student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;
$branch = isset($_GET['branch']) ? $_GET['branch'] : null;
$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

try {
    if ($student_id) {
        $stmt = $pdo->prepare("SELECT * FROM attendance WHERE student_id = ? AND date = ?");
        $stmt->execute([$student_id, $date]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'attendance' => $records]);
    } else if ($branch) {
        $stmt = $pdo->prepare("SELECT a.*, u.name, u.childName, u.childClass, u.branch FROM attendance a JOIN users u ON a.student_id = u.id WHERE u.branch = ? AND a.date = ?");
        $stmt->execute([$branch, $date]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'attendance' => $records]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Missing student_id or branch']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>