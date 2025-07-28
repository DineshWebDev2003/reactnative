<?php
require_once 'db.php';
header('Content-Type: application/json');

// Example: create 5 test parents
try {
    for ($i = 1; $i <= 5; $i++) {
        $name = "Test Parent $i";
        $email = "parent$i@example.com";
        $mobile = "900000000$i";
        $branch = "Test Branch";
        $childName = "Child $i";
        $childClass = "Class $i";
        $role = "Parent";
        $password = password_hash("password$i", PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, mobile, branch, childName, childClass, role, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $email, $mobile, $branch, $childName, $childClass, $role, $password]);
    }
    echo json_encode(["success" => true, "message" => "Test parents created."]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?> 