<?php
require_once 'db.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$data = json_decode(file_get_contents("php://input"));
if (!$data || !isset($data->name) || !isset($data->branch) || !isset($data->role)) {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit();
}
$name = $data->name;
$branch = $data->branch;
$role = $data->role;
$email = isset($data->email) ? $data->email : '';
$mobile = isset($data->mobile) ? $data->mobile : '';
$timetable = isset($data->timetable) ? $data->timetable : '';

try {
    $sql = "INSERT INTO staff (name, branch, role, email, mobile, timetable) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$name, $branch, $role, $email, $mobile, $timetable]);
    if ($result) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to create staff"]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?> 