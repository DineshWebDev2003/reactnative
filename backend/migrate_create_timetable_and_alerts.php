<?php
require_once 'db.php';

try {
    // Timetable table
    $pdo->exec("CREATE TABLE IF NOT EXISTS timetable (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch VARCHAR(100) DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        time VARCHAR(20),
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Alerts table
    $pdo->exec("CREATE TABLE IF NOT EXISTS alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        branch VARCHAR(100) DEFAULT NULL,
        user_id INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        extra_data JSON DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    echo "Tables 'timetable' and 'alerts' created or already exist.\n";
} catch (PDOException $e) {
    echo "Error creating tables: " . $e->getMessage() . "\n";
}
?> 