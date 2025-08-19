-- Fix attendance table structure and ensure proper data storage

-- Check if attendance table exists, if not create it
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','late') NOT NULL DEFAULT 'absent',
  `in_time` time DEFAULT NULL,
  `out_time` time DEFAULT NULL,
  `marked_by` int(11) DEFAULT NULL,
  `method` enum('manual','qr','face','auto') DEFAULT 'manual',
  `guardian_id` int(11) DEFAULT NULL,
  `send_off` enum('yes','no') DEFAULT 'no',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_date` (`student_id`, `date`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_date` (`date`),
  KEY `idx_marked_by` (`marked_by`),
  KEY `idx_branch_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add missing columns if they don't exist
ALTER TABLE `attendance` 
ADD COLUMN IF NOT EXISTS `method` enum('manual','qr','face','auto') DEFAULT 'manual' AFTER `marked_by`,
ADD COLUMN IF NOT EXISTS `guardian_id` int(11) DEFAULT NULL AFTER `method`,
ADD COLUMN IF NOT EXISTS `send_off` enum('yes','no') DEFAULT 'no' AFTER `guardian_id`,
ADD COLUMN IF NOT EXISTS `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `send_off`,
ADD COLUMN IF NOT EXISTS `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Add unique constraint to prevent duplicate attendance records
ALTER TABLE `attendance` ADD UNIQUE KEY IF NOT EXISTS `unique_student_date` (`student_id`, `date`);

-- Add indexes for better performance
ALTER TABLE `attendance` ADD INDEX IF NOT EXISTS `idx_student_date` (`student_id`, `date`);
ALTER TABLE `attendance` ADD INDEX IF NOT EXISTS `idx_marked_by_date` (`marked_by`, `date`);
ALTER TABLE `attendance` ADD INDEX IF NOT EXISTS `idx_status_date` (`status`, `date`);

-- Update existing records to ensure proper data
UPDATE `attendance` SET `method` = 'manual' WHERE `method` IS NULL;
UPDATE `attendance` SET `send_off` = 'no' WHERE `send_off` IS NULL; 