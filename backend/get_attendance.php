<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

try {
    $student_id = isset($_GET['student_id']) ? trim($_GET['student_id']) : '';
    $branch = isset($_GET['branch']) ? trim($_GET['branch']) : '';
    $date = isset($_GET['date']) ? trim($_GET['date']) : '';

    if (empty($date)) {
        throw new Exception('Date is required (YYYY-MM-DD)');
    }

    if (empty($student_id) && empty($branch)) {
        throw new Exception('Either student_id or branch is required');
    }

    if (!empty($student_id)) {
        // Fetch attendance for a single student
        $stmt = $pdo->prepare("SELECT a.*, u.childName, u.childClass, u.branch FROM attendance a JOIN users u ON a.student_id = u.student_id WHERE a.student_id = ? AND a.date = ? LIMIT 1");
        $stmt->execute([$student_id, $date]);
        $attendance = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$attendance) {
            echo json_encode([
                'success' => true,
                'attendance' => null,
                'message' => 'No attendance record found for this student on this date.'
            ]);
            exit;
        }
        echo json_encode([
            'success' => true,
            'attendance' => $attendance
        ]);
        exit;
    }

    // Fetch attendance for all students in a branch
    $stmt = $pdo->prepare("SELECT a.*, u.childName, u.childClass, u.branch FROM attendance a JOIN users u ON a.student_id = u.student_id WHERE u.branch = ? AND a.date = ? ORDER BY u.childName");
    $stmt->execute([$branch, $date]);
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode([
        'success' => true,
        'attendance' => $attendance
    ]);
    exit;

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    exit;
}