<?php
require_once 'db.php';
header('Content-Type: application/json');

$teacher_id = isset($_GET['teacherId']) ? $_GET['teacherId'] : (isset($_GET['teacher_id']) ? $_GET['teacher_id'] : null);
$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

try {
    if (!$teacher_id) {
        echo json_encode(['success' => false, 'message' => 'Missing teacherId']);
        exit;
    }

    // Get teacher's branch
    $teacherStmt = $pdo->prepare("SELECT branch FROM users WHERE id = ? AND role = 'Teacher'");
    $teacherStmt->execute([$teacher_id]);
    $teacher = $teacherStmt->fetch(PDO::FETCH_ASSOC);

    if (!$teacher) {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
        exit;
    }

    $branch = $teacher['branch'];

    // Get attendance records for students in teacher's branch for the specified date
    // Also include students who don't have attendance records yet
    $stmt = $pdo->prepare("
        SELECT 
            a.id as attendance_id,
            a.student_id,
            a.date,
            COALESCE(a.status, 'absent') as status,
            a.in_time,
            a.out_time,
            a.marked_by,
            COALESCE(a.method, 'manual') as method,
            a.guardian_id,
            COALESCE(a.send_off, 'no') as send_off,
            u.id as user_id,
            u.childName,
            u.name,
            u.childClass,
            u.branch
        FROM users u 
        LEFT JOIN attendance a ON u.id = a.student_id AND a.date = ?
        WHERE u.branch = ? AND u.role = 'Student'
        ORDER BY u.childName
    ");
    $stmt->execute([$date, $branch]);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("Found " . count($records) . " attendance records for teacher $teacher_id, branch $branch, date $date");
    
    echo json_encode(['success' => true, 'attendance' => $records]);

} catch (PDOException $e) {
    error_log("Error in get_teacher_attendance: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 