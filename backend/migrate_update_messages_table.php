<?php
require_once 'db.php';

try {
    echo "Starting migration for 'messages' table...\n";

    // Check for sender_id column
    $check_sender = $pdo->query("SHOW COLUMNS FROM `messages` LIKE 'sender_id'");
    if ($check_sender->rowCount() == 0) {
        $pdo->exec("ALTER TABLE `messages` ADD `sender_id` INT NULL AFTER `id`;");
        echo "Column 'sender_id' added successfully.\n";
    } else {
        echo "Column 'sender_id' already exists.\n";
    }

    // Check for receiver_id column
    $check_receiver = $pdo->query("SHOW COLUMNS FROM `messages` LIKE 'receiver_id'");
    if ($check_receiver->rowCount() == 0) {
        $pdo->exec("ALTER TABLE `messages` ADD `receiver_id` INT NULL AFTER `sender_id`;");
        echo "Column 'receiver_id' added successfully.\n";
    } else {
        echo "Column 'receiver_id' already exists.\n";
    }

    // Check for created_at column
    $check_created_at = $pdo->query("SHOW COLUMNS FROM `messages` LIKE 'created_at'");
    if ($check_created_at->rowCount() == 0) {
        $pdo->exec("ALTER TABLE `messages` ADD `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `message`;");
        echo "Column 'created_at' added successfully.\n";
    } else {
        echo "Column 'created_at' already exists.\n";
    }

    echo "Migration completed.\n";
} catch (PDOException $e) {
    echo "Error updating table: " . $e->getMessage() . "\n";
}
?> 