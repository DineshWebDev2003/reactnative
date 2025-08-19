<?php
require_once 'db.php';

try {
    // Create face_match_logs table
    $sql = "CREATE TABLE IF NOT EXISTS face_match_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        parent_id INT NOT NULL,
        captured_image_path VARCHAR(255),
        match_result JSON,
        matched_parent VARCHAR(50),
        confidence DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_student_id (student_id),
        INDEX idx_parent_id (parent_id),
        INDEX idx_created_at (created_at)
    )";
    
    $pdo->exec($sql);
    echo "✅ face_match_logs table created successfully\n";
    
} catch (PDOException $e) {
    echo "❌ Error creating face_match_logs table: " . $e->getMessage() . "\n";
}
?> 