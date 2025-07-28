<?php
require_once 'db.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->id)) {
    echo json_encode(["success" => false, "message" => "Missing user ID"]);
    exit();
}

$id = intval($data->id);
$name = $data->name ?? '';
$role = $data->role ?? '';
$branch = $data->branch ?? '';
$email = $data->email ?? '';
$mobile = $data->mobile ?? '';
$password = $data->password ?? '';
$franchisee_share = isset($data->franchisee_share) ? floatval($data->franchisee_share) : null;

try {
    $fields = [
        'name' => $name,
        'role' => $role,
        'branch' => $branch,
        'email' => $email,
        'mobile' => $mobile
    ];
    if ($password) {
        $fields['password'] = password_hash($password, PASSWORD_DEFAULT);
    }
    if ($role === 'Franchisee' && $franchisee_share !== null) {
        $fields['franchisee_share'] = $franchisee_share;
    }

    $setStr = implode(', ', array_map(fn($k) => "$k = ?", array_keys($fields)));
    $params = array_values($fields);
    $params[] = $id;

    $sql = "UPDATE users SET $setStr WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute($params);

    if ($result) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update user"]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?> 