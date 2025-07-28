<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userId = $_POST['user_id'] ?? '';
    $name = $_POST['name'] ?? null;
    $email = $_POST['email'] ?? null;
    $mobile = $_POST['mobile'] ?? null;
    
    if (!$userId) {
        echo json_encode(["success" => false, "message" => "User ID is required"]);
        exit();
    }

    // Handle profile image upload
    $profileImagePath = null;
    if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/profiles/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $fileExtension = pathinfo($_FILES['profile_image']['name'], PATHINFO_EXTENSION);
        $fileName = 'profile_' . $userId . '_' . time() . '.' . $fileExtension;
        $uploadPath = $uploadDir . $fileName;
        if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $uploadPath)) {
            $profileImagePath = $uploadPath;
        } else {
            echo json_encode(["success" => false, "message" => "Failed to upload image"]);
            exit();
        }
    }

    // Build dynamic SQL for only provided fields
    $fields = [];
    $params = [];
    if ($name !== null) { $fields[] = 'name=?'; $params[] = $name; }
    if ($email !== null) { $fields[] = 'email=?'; $params[] = $email; }
    if ($mobile !== null) { $fields[] = 'mobile=?'; $params[] = $mobile; }
    if ($profileImagePath) { $fields[] = 'profile_image=?'; $params[] = $profileImagePath; }
    if (empty($fields)) {
        echo json_encode(["success" => false, "message" => "No fields to update"]);
        exit();
    }
    $params[] = $userId;
    $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id=?";
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode([
            "success" => true,
            "message" => "Profile updated successfully",
            "profile_image" => $profileImagePath
        ]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}
?> 