const db = require('../config/database');

class Match {
  static async getMatches(userId) {
    const [rows] = await db.execute(
      `SELECT m.*,
              p1.first_name as user1_name, p1.profile_photo as user1_photo,
              p2.first_name as user2_name, p2.profile_photo as user2_photo,
              u1.email as user1_email, u2.email as user2_email
       FROM matches m
       JOIN users u1 ON m.user1_id = u1.id
       JOIN users u2 ON m.user2_id = u2.id
       JOIN profiles p1 ON m.user1_id = p1.user_id
       JOIN profiles p2 ON m.user2_id = p2.user_id
       WHERE (m.user1_id = ? OR m.user2_id = ?) AND m.is_active = TRUE
       ORDER BY m.matched_at DESC`,
      [userId, userId]
    );

    // Format the response to show the other user's info
    return rows.map(match => {
      const isUser1 = match.user1_id === userId;
      return {
        matchId: match.id,
        matchedAt: match.matched_at,
        otherUser: {
          id: isUser1 ? match.user2_id : match.user1_id,
          name: isUser1 ? match.user2_name : match.user1_name,
          photo: isUser1 ? match.user2_photo : match.user1_photo,
          email: isUser1 ? match.user2_email : match.user1_email
        }
      };
    });
  }

  static async findById(matchId) {
    const [rows] = await db.execute(
      'SELECT * FROM matches WHERE id = ?',
      [matchId]
    );
    return rows[0];
  }

  static async unmatch(matchId) {
    await db.execute(
      'UPDATE matches SET is_active = FALSE WHERE id = ?',
      [matchId]
    );
  }

  static async isMatch(user1Id, user2Id) {
    const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    const [rows] = await db.execute(
      'SELECT * FROM matches WHERE user1_id = ? AND user2_id = ? AND is_active = TRUE',
      [smallerId, largerId]
    );
    return rows.length > 0;
  }
}

module.exports = Match;
