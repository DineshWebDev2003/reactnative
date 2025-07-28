<?php
require_once 'db.php';

try {
    // Drop existing timetable table if it exists, to be replaced
    $pdo->exec("DROP TABLE IF EXISTS timetable;");

    // Create the new timetable structure
    $pdo->exec("CREATE TABLE IF NOT EXISTS timetable_periods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch VARCHAR(100),
        day_of_week INT NOT NULL, -- 1 for Monday, 7 for Sunday
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        activity_name VARCHAR(255) NOT NULL,
        description TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    echo "Table 'timetable_periods' created successfully (old 'timetable' table removed).\n";
} catch (PDOException $e) {
    echo "Error creating table: " . $e->getMessage() . "\n";
}
?> 