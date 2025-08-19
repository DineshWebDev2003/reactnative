<?php
require_once 'db.php';
header('Content-Type: application/json');

$teacher_id = $_GET['teacherId'] ?? null;
$date = $_GET['date'] ?? date('Y-m-d');

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

    // Count attendance records for this branch and date
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        WHERE u.branch = ? AND a.date = ?
    ");
    $stmt->execute([$branch, $date]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get sample records
    $sampleStmt = $pdo->prepare("
        SELECT 
            a.student_id,
            a.status,
            a.in_time,
            a.out_time,
            a.method,
            u.childName,
            u.name
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        WHERE u.branch = ? AND a.date = ?
        LIMIT 5
    ");
    $sampleStmt->execute([$branch, $date]);
    $samples = $sampleStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'count' => $result['count'],
        'branch' => $branch,
        'date' => $date,
        'sample_records' => $samples
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 