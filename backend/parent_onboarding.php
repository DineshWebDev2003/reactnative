<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

$user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
if (!$user_id) {
    echo json_encode(["success" => false, "message" => "Missing user_id"]);
    exit();
}

$upload_dir = "uploads/parent_onboarding/";
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

$child_photo = $_FILES['child_photo'] ?? null;
$father_photo = $_FILES['father_photo'] ?? null;
$mother_photo = $_FILES['mother_photo'] ?? null;
$guardian_photo = $_FILES['guardian_photo'] ?? null;

// NEW: fetch names for each caretaker
$father_name   = $_POST['father_name']   ?? null;
$mother_name   = $_POST['mother_name']   ?? null;
$guardian_name = $_POST['guardian_name'] ?? null;

if (!$child_photo || !$father_photo || !$mother_photo || !$guardian_photo) {
    echo json_encode(["success" => false, "message" => "All photos are required."]);
    exit();
}

function save_image($file, $prefix, $user_id, $upload_dir) {
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = $prefix . "_" . $user_id . "." . $ext;
    $target = $upload_dir . $filename;
    if (move_uploaded_file($file['tmp_name'], $target)) {
        return $target;
    }
    return false;
}

$child_path = save_image($child_photo, 'child', $user_id, $upload_dir);
$father_path = save_image($father_photo, 'father', $user_id, $upload_dir);
$mother_path = save_image($mother_photo, 'mother', $user_id, $upload_dir);
$guardian_path = save_image($guardian_photo, 'guardian', $user_id, $upload_dir);

if (!$child_path || !$father_path || !$mother_path || !$guardian_path) {
    echo json_encode(["success" => false, "message" => "Failed to save images."]);
    exit();
}

try {
    // Updated query to also store names
    $sql = "UPDATE users 
            SET onboarding_complete = 1,
                child_photo    = ?,
                father_photo   = ?,
                mother_photo   = ?,
                guardian_photo = ?,
                father_name    = ?,
                mother_name    = ?,
                guardian_name  = ?
            WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        $child_path,
        $father_path,
        $mother_path,
        $guardian_path,
        $father_name,
        $mother_name,
        $guardian_name,
        $user_id
    ]);
    if ($result) {
        echo json_encode(["success" => true, "message" => "Onboarding complete!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update onboarding status."]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>