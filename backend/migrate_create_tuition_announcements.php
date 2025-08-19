<?php
include 'db.php';

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS tuition_announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        teacher_id INT DEFAULT NULL,
        branch VARCHAR(100) DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "Table 'tuition_announcements' created or already exists.\n";
} catch (PDOException $e) {
    echo "Error creating table: " . $e->getMessage() . "\n";
}
?> 