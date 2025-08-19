<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include 'db.php';

// Frontend: Show these roles as options: Founder, Franchisee, Teacher, Parent, Staff, tuition_teacher, tuition_student

// Refactored and improved functions for user ID generation.

function getBranchInitial($branchName) {
    if (empty($branchName)) return '';
    
    $map = [
        'Coimbatore' => 'C', 'Kolathur' => 'K', 'Tambaram' => 'T',
        'Pollachi' => 'P', 'Tiruppur' => 'R',
    ];

    if (isset($map[$branchName])) {
        return $map[$branchName];
    }
    
    // Fallback for unmapped branches
    return strtoupper(substr($branchName, 0, 1));
}

function generateNextId($pdo, $prefix, $tableName, $idField, $branch) {
    $sql = "SELECT $idField FROM $tableName WHERE branch = ? AND $idField LIKE ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$branch, $prefix . '%']);
    
    $maxNum = 0;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $id = $row[$idField];
        if (preg_match('/(\d+)$/', $id, $matches)) {
            $num = intval($matches[1]);
            if ($num > $maxNum) {
                $maxNum = $num;
            }
        }
    }
    return $maxNum + 1;
}

function generateUserId($pdo, $branch, $role) {
    $branchInitial = getBranchInitial($branch);
    $id = '';

    switch ($role) {
        case 'tuition_teacher':
            $prefix = "TNHK{$branchInitial}TUT";
            $nextNum = generateNextId($pdo, $prefix, 'users', 'staff_id', $branch);
            $id = $prefix . str_pad($nextNum, 2, '0', STR_PAD_LEFT);
            break;
        case 'tuition_student':
            $prefix = "TNHK{$branchInitial}TUS";
            $nextNum = generateNextId($pdo, $prefix, 'users', 'student_id', $branch);
            $id = $prefix . str_pad($nextNum, 3, '0', STR_PAD_LEFT);
            break;
        case 'Teacher':
        case 'Staff':
            $prefix = "TNHK{$branchInitial}S";
            $nextNum = generateNextId($pdo, $prefix, 'users', 'staff_id', $branch);
            $id = $prefix . str_pad($nextNum, 2, '0', STR_PAD_LEFT);
            break;
        case 'Parent':
            $prefix = "TNHK{$branchInitial}";
            $nextNum = generateNextId($pdo, $prefix, 'users', 'student_id', $branch);
            $id = $prefix . str_pad($nextNum, 3, '0', STR_PAD_LEFT);
            break;
        // Optional: handle other roles or a default case
    }
    return $id;
}

try {
    if (!$pdo) {
        throw new Exception("Database connection failed in db.php.");
    }

    $data = json_decode(file_get_contents("php://input"));

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON received: " . json_last_error_msg());
    }

    $name = $data->name ?? '';
    $role = $data->role ?? '';
    $branch = $data->branch ?? '';
    $email = $data->email ?? '';
    $mobile = $data->mobile ?? '';
    $password = $data->password ?? '';
    $childName = $data->childName ?? '';
    $childClass = $data->childClass ?? '';
    $fee_due = isset($data->fee_due) ? floatval($data->fee_due) : 0;
    $franchisee_share = isset($data->franchisee_share) ? floatval($data->franchisee_share) : null;

    if (!$name || !$role || !$branch || !$email || !$mobile || !$password) {
        echo json_encode(["success" => false, "message" => "Missing required fields"]);
        exit;
    }

    $student_id = null;
    $staff_id = null;
    if ($role === 'Teacher' || $role === 'Staff' || $role === 'tuition_teacher') {
        $staff_id = generateUserId($pdo, $branch, $role);
    } else if ($role === 'Parent' || $role === 'tuition_student') {
        $student_id = generateUserId($pdo, $branch, $role);
    }

    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Build fields and values arrays for dynamic SQL
    $fields = ['name', 'role', 'branch', 'email', 'mobile', 'password', 'childName', 'childClass', 'fee_due', 'franchisee_share'];
    $values = [$name, $role, $branch, $email, $mobile, $hashed_password, $childName, $childClass, $fee_due, $franchisee_share];

    // Add student_id only for Parent/tuition_student
    if ($role === 'Parent' || $role === 'tuition_student') {
        $fields[] = 'student_id';
        $values[] = $student_id;
    }

    // Add staff_id only for Teacher/Staff/tuition_teacher
    if ($role === 'Teacher' || $role === 'Staff' || $role === 'tuition_teacher') {
        $fields[] = 'staff_id';
        $values[] = $staff_id;
    }

    $fieldList = implode(', ', $fields);
    $placeholders = implode(', ', array_fill(0, count($fields), '?'));

    $sql = "INSERT INTO users ($fieldList) VALUES ($placeholders)";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute($values);

    if ($result) {
        $new_user_id = $pdo->lastInsertId();

        // Log alert for new admission
        $alert_msg = "New user created: $name (Role: $role, Branch: $branch)";
        $alert_stmt = $pdo->prepare("INSERT INTO alerts (type, message, user_id, branch, extra_data) VALUES ('new_admission', ?, ?, ?, ?)");
        $alert_stmt->execute([$alert_msg, $new_user_id, $branch, json_encode($data)]);

        echo json_encode(["success" => true, "id" => $new_user_id, "student_id" => $student_id, "staff_id" => $staff_id]);
    } else {
        $errorInfo = $stmt->errorInfo();
        echo json_encode(["success" => false, "message" => "Failed to create user.", "error" => $errorInfo[2]]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "An error occurred: " . $e->getMessage()]);
}