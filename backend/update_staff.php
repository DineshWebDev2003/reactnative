<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));
if (!$data || !isset($data->id)) {
    echo json_encode(["success" => false, "message" => "Missing staff ID"]);
    exit();
}
$id = intval($data->id);
$name = isset($data->name) ? $data->name : '';
$role = isset($data->role) ? $data->role : '';
$email = isset($data->email) ? $data->email : '';
$mobile = isset($data->mobile) ? $data->mobile : '';
$timetable = isset($data->timetable) ? $data->timetable : '';

try {
    $sql = "UPDATE staff SET name=?, role=?, email=?, mobile=?, timetable=? WHERE id=?";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$name, $role, $email, $mobile, $timetable, $id]);
    if ($result) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update staff"]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?> 