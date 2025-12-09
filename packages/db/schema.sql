
-- Table to store food claim information
CREATE TABLE claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL COMMENT 'Corresponds to student_id in existing_student_info',
  officer_name VARCHAR(255) NOT NULL,
  tinsel_day INT NOT NULL,
  food_claimed VARCHAR(255) NOT NULL,
  claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- This table replaces the previous 'tinsel_settings' table for storing day-specific information.
CREATE TABLE tinsel_days (
  day_number INT PRIMARY KEY,
  food_of_the_day VARCHAR(255) NOT NULL
);

-- This table stores global configuration for the Tinsel Treats event.
CREATE TABLE tinsel_config (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL
);

-- Initial data for the new tables
INSERT INTO tinsel_days (day_number, food_of_the_day) VALUES
(1, 'Pizza'),
(2, 'Burger'),
(3, 'Pasta');

INSERT INTO tinsel_config (setting_key, setting_value) VALUES
('current_day', '1');
