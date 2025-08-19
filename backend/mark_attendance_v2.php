<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

date_default_timezone_set('Asia/Kolkata');

require_once 'db.php';
header('Content-Type: application/json');

// Log raw POST input for debugging
file_put_contents('debug_attendance.txt', file_get_contents('php://input'), FILE_APPEND);

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

// Validate required fields
$required = ['student_id', 'action', 'method'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

// Extract data
$student_id = $input['student_id'];
$action = $input['action']; // 'in' or 'out'
$method = $input['method']; // 'manual' or 'face_recognition'
$relationship = $input['relationship'] ?? null;
$send_off_name = $input['send_off_name'] ?? null;
$notes = $input['notes'] ?? null;
$marked_by = $input['marked_by'] ?? null;

try {
    $pdo->beginTransaction();
    $current_time = date('H:i:s');
    $current_date = date('Y-m-d');
    
    // 1. Validate student exists
    $stmt = $pdo->prepare("SELECT id, childName, branch FROM users WHERE student_id = ? AND role = 'Parent'");
    $stmt->execute([$student_id]);
    $student = $stmt->fetch();
    
    if (!$student) {
        throw new Exception("Student not found with ID: $student_id");
    }
    
    // 2. Get or create attendance record for today
    $stmt2 = $pdo->prepare("
        SELECT * FROM attendance 
        WHERE student_id = ? AND date = ?
        FOR UPDATE
    ");
    $stmt2->execute([$student_id, $current_date]);
    $attendance = $stmt2->fetch(PDO::FETCH_ASSOC);
    
    if (!$attendance) {
        $pdo->prepare("
            INSERT INTO attendance 
            (student_id, date, status, in_time, marked_by, method, relationship, notes)
            VALUES (?, ?, 'present', ?, ?, ?, ?, ?)
        ")->execute([
            $student_id, 
            $current_date,
            $current_time,
            $marked_by,
            $method,
            $relationship,
            $notes
        ]);
        $attendance_id = $pdo->lastInsertId();
    } else {
        $attendance_id = $attendance['id'];
    }
    
    // 3. Log the action
    $pdo->prepare("
        INSERT INTO attendance_logs 
        (attendance_id, student_id, action, time, marked_by, method, relationship, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ")->execute([
        $attendance_id,
        $student_id,
        $action,
        date('Y-m-d H:i:s'),
        $marked_by,
        $method,
        $relationship,
        $notes
    ]);
    
    // 4. Update attendance record based on action
    if ($action === 'in') {
        $pdo->prepare("
            UPDATE attendance 
            SET in_time = ?, 
                status = 'present',
                relationship = COALESCE(?, relationship),
                updated_at = NOW()
            WHERE id = ?
        ")->execute([$current_time, $relationship, $attendance_id]);
    } else { // out
        $pdo->prepare("
            UPDATE attendance 
            SET out_time = ?,
                send_off_name = ?,
                updated_at = NOW()
            WHERE id = ?
        ")->execute([$current_time, $send_off_name, $attendance_id]);
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => "Attendance marked $action successfully",
        'data' => [
            'student_id' => $student_id,
            'student_name' => $student['childName'],
            'action' => $action,
            'time' => $current_time,
            'relationship' => $relationship,
            'send_off_name' => $send_off_name
        ]
    ]);
    
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    exit;
}