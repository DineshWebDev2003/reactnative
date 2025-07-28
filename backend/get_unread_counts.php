<?php
include 'db.php';
header('Content-Type: application/json');

$user_id = $_GET['user_id'];

$sql = "SELECT sender_id, COUNT(*) as unread_count
        FROM messages
        WHERE receiver_id = ? AND status = 'sent'
        GROUP BY sender_id";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$counts = [];
while ($row = $result->fetch_assoc()) {
    $counts[$row['sender_id']] = $row['unread_count'];
}
echo json_encode(['success' => true, 'unread_counts' => $counts]);
$stmt->close();
$conn->close();
?> 