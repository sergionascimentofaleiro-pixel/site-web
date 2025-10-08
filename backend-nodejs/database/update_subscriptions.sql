-- Remove message count column (we'll track conversations instead)
ALTER TABLE users DROP COLUMN IF EXISTS messages_sent_count;

-- Create user_conversations table to track which conversations user has participated in
CREATE TABLE IF NOT EXISTS user_conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    match_id INT NOT NULL,
    first_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_match (user_id, match_id),
    INDEX idx_user_id (user_id),
    INDEX idx_match_id (match_id),
    INDEX idx_first_message (first_message_at)
);
