-- Database Setup Script

-- Create database
CREATE DATABASE IF NOT EXISTS dating_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user if not exists (run as root)
CREATE USER IF NOT EXISTS 'devuser'@'localhost' IDENTIFIED BY 'Manuela2011!';
GRANT ALL PRIVILEGES ON dating_app.* TO 'devuser'@'localhost';
FLUSH PRIVILEGES;

-- Use the database
USE dating_app;
