<?php
require_once 'db.php';
header('Content-Type: application/json');

// Accept both teacher_id and teacherId
$teacher_id = $_GET['teacher_id'] ?? $_GET['teacherId'] ?? null;
if (!$teacher_id) {
    echo json_encode(['success' => false, 'message' => 'Missing teacher_id']);
    exit;
}

// Get teacher's branch
$stmt = $pdo->prepare("SELECT branch FROM users WHERE id = ? AND (role = 'Teacher' OR role = 'Staff')");
$stmt->execute([$teacher_id]);
$row = $stmt->fetch();

if ($row) {
    $branch = $row['branch'];
    
    // Query for students - look for users with student-related roles or child information
    $stmt2 = $pdo->prepare("
        SELECT 
            u.id, 
            u.childName, 
            u.student_id, 
            u.branch,
            u.child_photo,
            u.childClass,
            u.profile_image,
            u.mobile
        FROM users u
        WHERE u.branch = ? AND u.role = 'Parent' AND u.student_id IS NOT NULL
        ORDER BY u.childName
    ");
    $stmt2->execute([$branch]);
    $students = $stmt2->fetchAll();

    // Clean up child_photo URLs and add mobile field for compatibility
    foreach ($students as &$student) {
        if ($student['child_photo'] && $student['child_photo'] !== 'null' && $student['child_photo'] !== '') {
            if (!filter_var($student['child_photo'], FILTER_VALIDATE_URL)) {
                $student['child_photo'] = 'uploads/parent_onboarding/' . basename($student['child_photo']);
            }
        } else {
            $student['child_photo'] = null;
        }
    }

    echo json_encode(['success' => true, 'students' => $students]);
} else {
    echo json_encode(['success' => false, 'message' => 'Teacher not found']);
}
?> 