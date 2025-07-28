<?php
require_once 'db.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$data = json_decode(file_get_contents("php://input"));
if (!isset($data->id) || !isset($data->status)) {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit();
}

$id = (int)$data->id;
$status = $data->status;

try {
    $stmt = $pdo->prepare("UPDATE income_expense SET status=? WHERE id=?");
    $result = $stmt->execute([$status, $id]);
    if ($result) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update status"]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?> 