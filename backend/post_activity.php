<?php
require_once 'db.php';

header('Content-Type: application/json');

// Enable error logging
error_log("Activity posting started");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Check if GD library is available
if (!extension_loaded('gd')) {
    echo json_encode(['success' => false, 'message' => 'GD library not available. Please contact administrator.']);
    exit;
}

$kid_id = isset($_POST['kid_id']) ? intval($_POST['kid_id']) : 0;
$branch = isset($_POST['branch']) ? $_POST['branch'] : '';
$frame = isset($_POST['frame']) ? $_POST['frame'] : '';
$activity_text = isset($_POST['activity_text']) ? $_POST['activity_text'] : '🏃‍♂️ Activity';

error_log("Received data: kid_id=$kid_id, branch=$branch, frame=$frame, activity_text=$activity_text");

if (!$kid_id || !$branch || !isset($_FILES['image'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// Handle image upload and overlay processing
$target_dir = 'uploads/activities/';
if (!is_dir($target_dir)) {
    if (!mkdir($target_dir, 0777, true)) {
        echo json_encode(['success' => false, 'message' => 'Failed to create uploads directory']);
        exit;
    }
}

// Create frames directory if it doesn't exist
$frames_dir = 'frames/';
if (!is_dir($frames_dir)) {
    if (!mkdir($frames_dir, 0777, true)) {
        echo json_encode(['success' => false, 'message' => 'Failed to create frames directory']);
        exit;
    }
}

// Create fonts directory if it doesn't exist
$fonts_dir = 'fonts/';
if (!is_dir($fonts_dir)) {
    if (!mkdir($fonts_dir, 0777, true)) {
        echo json_encode(['success' => false, 'message' => 'Failed to create fonts directory']);
        exit;
    }
}

$filename = 'activity_' . time() . '_' . rand(1000,9999) . '.jpg';
$target_file = $target_dir . $filename;

// Get uploaded child image
$child_tmp = $_FILES['image']['tmp_name'];
$child_type = $_FILES['image']['type'];

error_log("Child image: tmp=$child_tmp, type=$child_type");

if (!file_exists($child_tmp)) {
    echo json_encode(['success' => false, 'message' => 'Uploaded image file not found']);
    exit;
}

// Load frame image (use local frame images)
$frame_path = '../assets/frames/' . ($frame ? $frame . '.png' : 'frame1.png');

error_log("Attempting to load frame from: $frame_path");

// Check if frame exists locally
if (!file_exists($frame_path)) {
    error_log("Frame not found at: $frame_path - creating default frame");
    // If frame not found, create a default frame
    $default_frame = imagecreatetruecolor(800, 600);
    if (!$default_frame) {
        echo json_encode(['success' => false, 'message' => 'Failed to create default frame']);
        exit;
    }
    
    // Create a nice gradient background
    $bg_color1 = imagecolorallocate($default_frame, 135, 206, 235); // Sky blue
    $bg_color2 = imagecolorallocate($default_frame, 255, 255, 255); // White
    
    // Create gradient effect
    for ($i = 0; $i < 600; $i++) {
        $ratio = $i / 600;
        $r = $bg_color1[0] * (1 - $ratio) + $bg_color2[0] * $ratio;
        $g = $bg_color1[1] * (1 - $ratio) + $bg_color2[1] * $ratio;
        $b = $bg_color1[2] * (1 - $ratio) + $bg_color2[2] * $ratio;
        $color = imagecolorallocate($default_frame, $r, $g, $b);
        imageline($default_frame, 0, $i, 800, $i, $color);
    }
    
    // Add a border
    $border_color = imagecolorallocate($default_frame, 100, 100, 100);
    imagerectangle($default_frame, 0, 0, 799, 599, $border_color);
    
    $temp_frame_path = $frame_path;
    if (!imagepng($default_frame, $temp_frame_path)) {
        echo json_encode(['success' => false, 'message' => 'Failed to save default frame']);
        exit;
    }
    imagedestroy($default_frame);
    error_log("Created default frame at: $temp_frame_path");
} else {
    // Use the local frame directly
    $temp_frame_path = $frame_path;
    error_log("Using local frame at: $temp_frame_path");
}

// Load child image based on type
$child_img = null;
if (strpos($child_type, 'jpeg') !== false || strpos($child_type, 'jpg') !== false) {
    $child_img = imagecreatefromjpeg($child_tmp);
} elseif (strpos($child_type, 'png') !== false) {
    $child_img = imagecreatefrompng($child_tmp);
} else {
    echo json_encode(['success' => false, 'message' => 'Unsupported image format. Please use JPG or PNG.']);
    exit;
}

if (!$child_img) {
    echo json_encode(['success' => false, 'message' => 'Failed to load child image']);
    exit;
}

error_log("Child image loaded successfully");

// Load frame image from temp location
$frame_img = imagecreatefrompng($temp_frame_path);
if (!$frame_img) {
    echo json_encode(['success' => false, 'message' => 'Failed to load frame image']);
    exit;
}

error_log("Frame image loaded successfully");

// Get dimensions
$frame_width = imagesx($frame_img);
$frame_height = imagesy($frame_img);
$child_width = imagesx($child_img);
$child_height = imagesy($child_img);

error_log("Dimensions: frame=${frame_width}x${frame_height}, child=${child_width}x${child_height}");

// Create final image (same size as frame)
$final_img = imagecreatetruecolor($frame_width, $frame_height);
if (!$final_img) {
    echo json_encode(['success' => false, 'message' => 'Failed to create final image']);
    exit;
}

// Enable alpha blending for transparency support
imagealphablending($final_img, true);
imagesavealpha($final_img, true);

// Fill with transparent background
$transparent = imagecolorallocatealpha($final_img, 0, 0, 0, 127);
imagefill($final_img, 0, 0, $transparent);

// Copy frame to final image (this should be the background)
if (!imagecopy($final_img, $frame_img, 0, 0, 0, 0, $frame_width, $frame_height)) {
    echo json_encode(['success' => false, 'message' => 'Failed to copy frame to final image']);
    exit;
}

error_log("Frame copied to final image");

// Calculate child image position (center it on the frame)
$child_x = ($frame_width - $child_width) / 2;
$child_y = ($frame_height - $child_height) / 2;

// If child image is larger than frame, resize it
if ($child_width > $frame_width || $child_height > $frame_height) {
    $scale = min($frame_width / $child_width, $frame_height / $child_height);
    $new_child_width = $child_width * $scale;
    $new_child_height = $child_height * $scale;
    
    $child_resized = imagecreatetruecolor($new_child_width, $new_child_height);
    if (!$child_resized) {
        echo json_encode(['success' => false, 'message' => 'Failed to create resized child image']);
        exit;
    }
    
    // Preserve transparency for PNG
    if (strpos($child_type, 'png') !== false) {
        imagealphablending($child_resized, false);
        imagesavealpha($child_resized, true);
        $transparent = imagecolorallocatealpha($child_resized, 255, 255, 255, 127);
        imagefill($child_resized, 0, 0, $transparent);
    }
    
    if (!imagecopyresampled($child_resized, $child_img, 0, 0, 0, 0, $new_child_width, $new_child_height, $child_width, $child_height)) {
        echo json_encode(['success' => false, 'message' => 'Failed to resize child image']);
        exit;
    }
    
    // Update dimensions
    $child_width = $new_child_width;
    $child_height = $new_child_height;
    $child_x = ($frame_width - $child_width) / 2;
    $child_y = ($frame_height - $child_height) / 2;
    
    imagedestroy($child_img);
    $child_img = $child_resized;
    error_log("Child image resized to: ${child_width}x${child_height}");
}

// Overlay child image onto final image (on top of the frame)
if (!imagecopy($final_img, $child_img, $child_x, $child_y, 0, 0, $child_width, $child_height)) {
    echo json_encode(['success' => false, 'message' => 'Failed to overlay child image']);
    exit;
}

error_log("Child image overlaid successfully at position: x=$child_x, y=$child_y");

// Add activity text
$font_path = $fonts_dir . 'arial.ttf';
if (!file_exists($font_path)) {
    // Use default font if TTF not available
    $text_color = imagecolorallocate($final_img, 255, 255, 255); // White text for better visibility
    $font_size = 5; // Default font size
    
    // Calculate text position (bottom of image)
    $text_x = 20;
    $text_y = $frame_height - 20;
    
    if (!imagestring($final_img, $font_size, $text_x, $text_y, $activity_text, $text_color)) {
        error_log("Failed to add text with default font");
    }
} else {
    // Use TTF font
    $font_size = 24;
    $text_color = imagecolorallocate($final_img, 255, 255, 255); // White text for better visibility
    
    // Calculate text position (bottom of image)
    $bbox = imagettfbbox($font_size, 0, $font_path, $activity_text);
    $text_width = $bbox[2] - $bbox[0];
    $text_x = ($frame_width - $text_width) / 2; // Center text
    $text_y = $frame_height - 30;
    
    if (!imagettftext($final_img, $font_size, 0, $text_x, $text_y, $text_color, $font_path, $activity_text)) {
        error_log("Failed to add text with TTF font");
    }
}

error_log("Text added successfully");

// Save the final merged image
if (!imagejpeg($final_img, $target_file, 90)) {
    echo json_encode(['success' => false, 'message' => 'Failed to save merged image']);
    exit;
}

error_log("Final image saved to: $target_file");

// Clean up image resources
imagedestroy($child_img);
imagedestroy($frame_img);
imagedestroy($final_img);

// Insert into activities table
try {
    $stmt = $pdo->prepare("INSERT INTO activities (kid_id, branch, frame, image_path, activity_text, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
    $result = $stmt->execute([$kid_id, $branch, $frame, $target_file, $activity_text]);
    
    if ($result) {
        error_log("Activity saved to database successfully");
        echo json_encode(['success' => true, 'message' => 'Activity posted successfully with merged image']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save activity to database']);
    }
} catch (Exception $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} 
?> 