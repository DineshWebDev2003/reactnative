<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include 'db.php';

$data = json_decode(file_get_contents("php://input"));
$name = $conn->real_escape_string($data->name);
$address = $conn->real_escape_string($data->address);

$sql = "INSERT INTO branches (name, address) VALUES ('$name', '$address')";
if ($conn->query($sql) === TRUE) {
    echo json_encode(["success" => true, "id" => $conn->insert_id]);
} else {
    echo json_encode(["success" => false, "message" => $conn->error]);
}
$conn->close();
?> 