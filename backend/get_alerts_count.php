<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include 'db.php';

$branch = $_GET['branch'] ?? '';
$result = $conn->query("SELECT COUNT(*) as count FROM alerts WHERE branch='$branch' AND is_read=0");
$row = $result->fetch_assoc();

echo json_encode(["success" => true, "count" => $row['count']]);
$conn->close();
?> 