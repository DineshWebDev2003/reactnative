<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['attendance']) || !is_array($data['attendance'])) {
    echo json_encode(['success' => false, 'message' => 'Missing attendance data']);
    exit;
}

$success = true;
$messages = [];

foreach ($data['attendance'] as $record) {
    $student_id = $record['studentId'] ?? null;
    $date = $record['date'] ?? date('Y-m-d');
    $status = $record['status'] ?? null;
    $in_time = $record['in_time'] ?? null;
    $out_time = $record['out_time'] ?? null;
    $marked_by = $record['teacherId'] ?? null;
    $method = $record['method'] ?? 'manual';
    $guardian_id = $record['guardian_id'] ?? null;
    $send_off = $record['send_off'] ?? 'no';

    if (!$student_id || !$status) {
        $success = false;
        $messages[] = "Missing student_id or status for one record";
        continue;
    }

    // Log alert for attendance
    $alert_msg = "Attendance marked for student ID $student_id with status: $status";
    $alert_stmt = $pdo->prepare("INSERT INTO alerts (type, message, user_id, extra_data) VALUES ('attendance', ?, ?, ?)");
    $alert_stmt->execute([$alert_msg, $student_id, json_encode($record)]);

    // Check if attendance exists
    $stmt = $pdo->prepare("SELECT id FROM attendance WHERE student_id = ? AND date = ?");
    $stmt->execute([$student_id, $date]);
    if ($stmt->fetch()) {
        // Update
        $stmt2 = $pdo->prepare("UPDATE attendance SET status=?, in_time=?, out_time=?, marked_by=?, method=?, guardian_id=?, send_off=? WHERE student_id=? AND date=?");
        $stmt2->execute([$status, $in_time, $out_time, $marked_by, $method, $guardian_id, $send_off, $student_id, $date]);
        $messages[] = "Attendance updated for student $student_id";
    } else {
        // Insert
        $stmt2 = $pdo->prepare("INSERT INTO attendance (student_id, date, status, in_time, out_time, marked_by, method, guardian_id, send_off) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt2->execute([$student_id, $date, $status, $in_time, $out_time, $marked_by, $method, $guardian_id, $send_off]);
        $messages[] = "Attendance marked for student $student_id";
    }
}

echo json_encode(['success' => $success, 'messages' => $messages]);
?> 