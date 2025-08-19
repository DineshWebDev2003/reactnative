<?php
require_once 'db.php';

try {
    // Add activity_text column to activities table
    $sql = "ALTER TABLE activities ADD COLUMN IF NOT EXISTS activity_text TEXT DEFAULT '🏃‍♂️ Activity' AFTER image_path";
    
    $pdo->exec($sql);
    echo "✅ activity_text column added to activities table successfully\n";
    
} catch (PDOException $e) {
    echo "❌ Error adding activity_text column: " . $e->getMessage() . "\n";
}
?> 