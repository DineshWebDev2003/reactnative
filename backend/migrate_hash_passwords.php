<?php
include 'db.php';

// Fetch all users
$stmt = $pdo->query("SELECT id, password FROM users");
$users = $stmt->fetchAll();

$updated = 0;
foreach ($users as $user) {
    $id = $user['id'];
    $password = $user['password'];

    // Check if password is already hashed (60 chars and starts with $2y$)
    if (strlen($password) === 60 && strpos($password, '$2y$') === 0) {
        continue; // Already hashed, skip
    }

    // Hash the plain-text password
    $hashed = password_hash($password, PASSWORD_DEFAULT);

    // Update the user with the hashed password
    $update = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $update->execute([$hashed, $id]);
    $updated++;
}

echo "Updated $updated user(s) with hashed passwords.\n";
?> 