<?php
include 'db.php';

try {
    // Create homework table
    $pdo->exec("CREATE TABLE IF NOT EXISTS homework (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        teacher_id INT NOT NULL,
        date DATE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(255),
        status ENUM('assigned','submitted','reviewed') DEFAULT 'assigned',
        feedback TEXT,
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (teacher_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Create homework_submissions table
    $pdo->exec("CREATE TABLE IF NOT EXISTS homework_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        homework_id INT NOT NULL,
        student_id INT NOT NULL,
        file_path VARCHAR(255),
        submitted_at DATETIME,
        FOREIGN KEY (homework_id) REFERENCES homework(id),
        FOREIGN KEY (student_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    echo "Tables 'homework' and 'homework_submissions' created or already exist.\n";
} catch (PDOException $e) {
    echo "Error creating tables: " . $e->getMessage() . "\n";
}
?> 