<?php
require_once 'db.php';
header('Content-Type: application/json');

try {
    // Check if fee_due_date column exists
    $stmt = $pdo->prepare("SHOW COLUMNS FROM users LIKE 'fee_due_date'");
    $stmt->execute();
    $columnExists = $stmt->fetch();
    
    if (!$columnExists) {
        // Add fee_due_date column
        $pdo->exec("ALTER TABLE users ADD COLUMN fee_due_date DATE NULL");
        echo json_encode(['success' => true, 'message' => 'fee_due_date column added successfully']);
    } else {
        echo json_encode(['success' => true, 'message' => 'fee_due_date column already exists']);
    }
    
    // Set due dates for users with fees: 30 days from creation or fee assignment
    $stmt2 = $pdo->prepare("
        UPDATE users 
        SET fee_due_date = DATE_ADD(created_at, INTERVAL 30 DAY) 
        WHERE fee_due > 0 AND fee_due_date IS NULL AND created_at IS NOT NULL
    ");
    $stmt2->execute();
    $updatedRows = $stmt2->rowCount();
    
    // For users without created_at, set to 30 days from now
    $stmt3 = $pdo->prepare("
        UPDATE users 
        SET fee_due_date = DATE_ADD(CURDATE(), INTERVAL 30 DAY) 
        WHERE fee_due > 0 AND fee_due_date IS NULL AND (created_at IS NULL OR created_at = '')
    ");
    $stmt3->execute();
    $updatedRows2 = $stmt3->rowCount();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Database setup completed with 30-day due dates',
        'updated_users_with_created_at' => $updatedRows,
        'updated_users_without_created_at' => $updatedRows2,
        'total_updated' => $updatedRows + $updatedRows2
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?> 