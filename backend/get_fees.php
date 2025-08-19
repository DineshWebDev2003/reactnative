<?php
include 'db.php';
header('Content-Type: application/json');

$where = [];
if (isset($_GET['branch']) && $_GET['branch'] !== '') $where[] = "branch='" . $conn->real_escape_string($_GET['branch']) . "'";
if (isset($_GET['class']) && $_GET['class'] !== '') $where[] = "class='" . $conn->real_escape_string($_GET['class']) . "'";
if (isset($_GET['parent_id']) && $_GET['parent_id'] !== '') $where[] = "parent_id='" . intval($_GET['parent_id']) . "'";
$whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';
$sql = "SELECT * FROM fees $whereSql ORDER BY due_date DESC";
$result = $conn->query($sql);
$fees = [];
while ($row = $result->fetch_assoc()) {
    $fees[] = $row;
}
$conn->close();
echo json_encode(['success' => true, 'fees' => $fees]);
?> 