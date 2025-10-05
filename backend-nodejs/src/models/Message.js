const db = require('../config/database');

class Message {
  static async create(matchId, senderId, receiverId, message) {
    const [result] = await db.execute(
      'INSERT INTO messages (match_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)',
      [matchId, senderId, receiverId, message]
    );
    return result.insertId;
  }

  static async getConversation(matchId, limit = 50) {
    const [rows] = await db.execute(
      `SELECT m.*,
              p.first_name as sender_name, p.profile_photo as sender_photo
       FROM messages m
       JOIN profiles p ON m.sender_id = p.user_id
       WHERE m.match_id = ?
       ORDER BY m.created_at DESC
       LIMIT ?`,
      [matchId, limit]
    );
    return rows.reverse(); // Return in chronological order
  }

  static async markAsRead(messageId) {
    await db.execute(
      'UPDATE messages SET is_read = TRUE WHERE id = ?',
      [messageId]
    );
  }

  static async markConversationAsRead(matchId, userId) {
    await db.execute(
      'UPDATE messages SET is_read = TRUE WHERE match_id = ? AND receiver_id = ?',
      [matchId, userId]
    );
  }

  static async getUnreadCount(userId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
      [userId]
    );
    return rows[0].count;
  }

  static async getLastMessages(userId) {
    const [rows] = await db.execute(
      `SELECT m1.*,
              p.first_name as sender_name, p.profile_photo as sender_photo
       FROM messages m1
       INNER JOIN (
         SELECT match_id, MAX(created_at) as max_created
         FROM messages
         WHERE sender_id = ? OR receiver_id = ?
         GROUP BY match_id
       ) m2 ON m1.match_id = m2.match_id AND m1.created_at = m2.max_created
       JOIN profiles p ON m1.sender_id = p.user_id
       ORDER BY m1.created_at DESC`,
      [userId, userId]
    );
    return rows;
  }
}

module.exports = Message;
