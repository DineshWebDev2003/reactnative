<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 1. Include your PDO connection
require_once 'db.php'; // This should define $pdo

if (!isset($_FILES['file'])) {
    echo json_encode(['success' => false, 'message' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file']['tmp_name'];
$results = [];
$all_success = true;

if (($handle = fopen($file, 'r')) !== false) {
    $row = 0;
    while (($data = fgetcsv($handle, 1000, ',')) !== false) {
        if ($row++ === 0) continue; // skip header
        
        // Parse CSV columns with new format
        $name = trim($data[0] ?? '');
        $role = trim($data[1] ?? '');
        $branch = trim($data[2] ?? '');
        $email = trim($data[3] ?? '');
        $mobile = trim($data[4] ?? '');
        $password = trim($data[5] ?? '');
        $parent_name = trim($data[6] ?? '');
        $child_name = trim($data[7] ?? '');
        $child_class = trim($data[8] ?? '');
        $category = trim($data[9] ?? '');
        $address = trim($data[10] ?? '');
        $emergency_contact = trim($data[11] ?? '');

        // Validate required fields
        if (!$name || !$role || !$branch || !$email || !$mobile || !$password) {
            $results[] = ['email' => $email, 'success' => false, 'message' => 'Missing required fields (name, role, branch, email, mobile, password)'];
            $all_success = false;
            continue;
        }

        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $results[] = ['email' => $email, 'success' => false, 'message' => 'Email already exists'];
            $all_success = false;
            continue;
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        try {
            // Insert user with all available data
            $stmt = $pdo->prepare("
                INSERT INTO users (name, role, branch, email, mobile, password, parent_name, child_name, child_class, category, address, emergency_contact, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $name, $role, $branch, $email, $mobile, $hashedPassword,
                $parent_name, $child_name, $child_class, $category, $address, $emergency_contact
            ]);
            
            $results[] = ['email' => $email, 'success' => true, 'message' => 'User created successfully'];
        } catch (Exception $e) {
            $results[] = ['email' => $email, 'success' => false, 'message' => 'Database error: ' . $e->getMessage()];
            $all_success = false;
        }
    }
    fclose($handle);
}

echo json_encode([
    'success' => $all_success,
    'message' => $all_success ? 'All users created successfully' : 'Some users failed to create',
    'results' => $results
]);
?> 