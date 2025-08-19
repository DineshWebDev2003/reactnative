<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include 'db.php';

$data = json_decode(file_get_contents("php://input"));
if (!$data || !isset($data->id)) {
    echo json_encode(["success" => false, "message" => "Missing staff ID"]);
    exit();
}
$id = intval($data->id);

$sql = "DELETE FROM staff WHERE id=$id";
if ($conn->query($sql)) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => $conn->error]);
}
$conn->close();
?> 