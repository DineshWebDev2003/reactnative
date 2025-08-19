<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
$host = "localhost";
$user = "root";
$pass = "";
$db = "tnhappykids";
$conn = new mysqli($host, $user, $pass, $db);

$branch = isset($_GET['branch']) ? $conn->real_escape_string($_GET['branch']) : '';
$result = $conn->query("SELECT * FROM staff WHERE branch='$branch'");
$staff = [];
while ($row = $result->fetch_assoc()) {
    $staff[] = $row;
}
echo json_encode(["success" => true, "staff" => $staff]);
$conn->close();
?> 