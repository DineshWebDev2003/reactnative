-- Create face_match_logs table for tracking face recognition attempts
CREATE TABLE IF NOT EXISTS `face_match_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `captured_image_path` varchar(255) DEFAULT NULL,
  `match_result` text DEFAULT NULL,
  `matched_parent` varchar(50) DEFAULT NULL,
  `confidence` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `parent_id` (`parent_id`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better performance
ALTER TABLE `face_match_logs` ADD INDEX `idx_student_date` (`student_id`, `created_at`);
ALTER TABLE `face_match_logs` ADD INDEX `idx_parent_date` (`parent_id`, `created_at`); 