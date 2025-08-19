<?php
require_once 'db.php';
header('Content-Type: application/json');

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$branch = isset($_GET['branch']) ? $_GET['branch'] : null;
$date = isset($_GET['date']) ? $_GET['date'] : null;
$month = isset($_GET['month']) ? $_GET['month'] : null;
$year = isset($_GET['year']) ? $_GET['year'] : null;
$export_type = isset($_GET['export_type']) ? $_GET['export_type'] : 'daily'; // daily, monthly

try {
    if (!$user_id) {
        echo json_encode(['success' => false, 'message' => 'Missing user_id']);
        exit;
    }

    // Get user role and branch
    $userStmt = $pdo->prepare("SELECT role, branch FROM users WHERE id = ?");
    $userStmt->execute([$user_id]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    $userRole = $user['role'];
    $userBranch = $user['branch'];

    // Determine which branches to query
    $branches = [];
    if ($userRole === 'Administration') {
        // Admin can see all branches
        if ($branch) {
            $branches = [$branch];
        } else {
            $branchStmt = $pdo->prepare("SELECT name FROM branches");
            $branchStmt->execute();
            $branches = $branchStmt->fetchAll(PDO::FETCH_COLUMN);
        }
    } elseif ($userRole === 'Franchisee') {
        // Franchisee can see their assigned branches
        $franchiseeStmt = $pdo->prepare("SELECT branch FROM franchisee_branches WHERE franchisee_id = ?");
        $franchiseeStmt->execute([$user_id]);
        $branches = $franchiseeStmt->fetchAll(PDO::FETCH_COLUMN);
    } else {
        // Teacher can only see their branch
        $branches = [$userBranch];
    }

    if (empty($branches)) {
        echo json_encode(['success' => false, 'message' => 'No branches found for user']);
        exit;
    }

    $attendanceData = [];

    foreach ($branches as $branchName) {
        if ($export_type === 'daily' && $date) {
            // Daily export
            $stmt = $pdo->prepare("
                SELECT 
                    a.student_id,
                    u.childName,
                    u.name as parent_name,
                    u.childClass,
                    a.status,
                    a.in_time,
                    a.out_time,
                    a.method,
                    a.date,
                    a.marked_by,
                    u.branch
                FROM attendance a 
                JOIN users u ON a.student_id = u.student_id 
                WHERE u.branch = ? AND a.date = ?
                ORDER BY u.childName
            ");
            $stmt->execute([$branchName, $date]);
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $attendanceData[$branchName] = $records;
            
        } elseif ($export_type === 'monthly' && $month && $year) {
            // Monthly export
            $startDate = "$year-$month-01";
            $endDate = date('Y-m-t', strtotime($startDate));
            
            $stmt = $pdo->prepare("
                SELECT 
                    a.student_id,
                    u.childName,
                    u.name as parent_name,
                    u.childClass,
                    a.status,
                    a.in_time,
                    a.out_time,
                    a.method,
                    a.date,
                    a.marked_by,
                    u.branch
                FROM attendance a 
                JOIN users u ON a.student_id = u.student_id 
                WHERE u.branch = ? AND a.date BETWEEN ? AND ?
                ORDER BY a.date, u.childName
            ");
            $stmt->execute([$branchName, $startDate, $endDate]);
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $attendanceData[$branchName] = $records;
        }
    }

    // Calculate summary statistics
    $summary = [];
    foreach ($attendanceData as $branchName => $records) {
        $totalStudents = count(array_unique(array_column($records, 'student_id')));
        $presentCount = count(array_filter($records, function($r) { return $r['status'] === 'present'; }));
        $absentCount = count(array_filter($records, function($r) { return $r['status'] === 'absent'; }));
        
        $summary[$branchName] = [
            'total_students' => $totalStudents,
            'present' => $presentCount,
            'absent' => $absentCount,
            'attendance_rate' => $totalStudents > 0 ? round(($presentCount / $totalStudents) * 100, 2) : 0
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => $attendanceData,
        'summary' => $summary,
        'export_type' => $export_type,
        'date' => $date,
        'month' => $month,
        'year' => $year,
        'branches' => $branches
    ]);

} catch (PDOException $e) {
    error_log("Error in export_attendance: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 