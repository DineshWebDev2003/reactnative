<?php
include 'db.php';
header('Content-Type: application/json');

// Test database connection
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit();
}

// Check if users table exists and has franchisees
$result = $conn->query("SELECT COUNT(*) as count FROM users WHERE role='Franchisee'");
$count = $result->fetch_assoc()['count'];

echo json_encode([
    'success' => true, 
    'total_franchisees' => $count,
    'message' => 'Database connection successful'
]);

$conn->close();
?> 