<?php
require_once 'db.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

try {
    $data = json_decode(file_get_contents("php://input"));
    if (
        !isset($data->amount) || !isset($data->desc) || !isset($data->type) ||
        !isset($data->role) || !isset($data->branch) || !isset($data->date)
    ) {
        echo json_encode(["success" => false, "message" => "Missing required fields"]);
        exit();
    }

    $amount = $data->amount;
    $desc = $data->desc;
    $type = $data->type;
    $role = $data->role;
    $branch = $data->branch;
    $date = $data->date;
    $is_shared = isset($data->is_shared) ? (int)$data->is_shared : 0;
    $franchisee_share = isset($data->franchisee_share) ? (float)$data->franchisee_share : 0;
    $status = isset($data->status) ? $data->status : 'pending';
    $created_by_role = isset($data->created_by_role) ? $data->created_by_role : null;
    if ($created_by_role === 'Administration') {
        $status = 'approved';
    }
    error_log('DEBUG: create_income.php received created_by_role=' . $created_by_role . ', role=' . $role);

    $sql = "INSERT INTO income_expense (amount, description, type, role, branch, date, is_shared, franchisee_share, status, created_by_role)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        $amount, $desc, $type, $role, $branch, $date, $is_shared, $franchisee_share, $status, $created_by_role
    ]);

    if ($result) {
        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to save record."]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?> 