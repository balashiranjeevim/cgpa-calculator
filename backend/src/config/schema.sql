-- CGPA Calculator Database Schema
CREATE DATABASE IF NOT EXISTS `cgpa_calculator_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cgpa_calculator_db`;

-- Table: semesters
CREATE TABLE IF NOT EXISTS `semesters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `semester_number` INT NOT NULL,
  `semester_heading` VARCHAR(150) NOT NULL,
  `sgpa` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
  `total_credits` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_semester_number` (`semester_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: subjects
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `semester_id` INT NOT NULL,
  `subject_name` VARCHAR(150) NOT NULL,
  `subject_code` VARCHAR(50) DEFAULT NULL,
  `credits` DECIMAL(4, 2) NOT NULL,
  `grade_point` DECIMAL(4, 2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_semester_id` (`semester_id`),
  CONSTRAINT `fk_subjects_semester`
    FOREIGN KEY (`semester_id`)
    REFERENCES `semesters` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
