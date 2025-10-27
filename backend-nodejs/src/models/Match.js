const db = require('../config/database');

class Match {
  static async getMatches(userId) {
    const [rows] = await db.execute(
      `SELECT m.*,
              p1.first_name as user1_name, p1.profile_photo as user1_photo,
              p1.birth_date as user1_birth_date,
              p2.first_name as user2_name, p2.profile_photo as user2_photo,
              p2.birth_date as user2_birth_date,
              u1.email as user1_email, u2.email as user2_email,
              c1.name as user1_city, c2.name as user2_city,
              co1.name as user1_country, co2.name as user2_country
       FROM matches m
       JOIN users u1 ON m.user1_id = u1.id
       JOIN users u2 ON m.user2_id = u2.id
       JOIN profiles p1 ON m.user1_id = p1.user_id
       JOIN profiles p2 ON m.user2_id = p2.user_id
       LEFT JOIN cities c1 ON p1.city_id = c1.id
       LEFT JOIN cities c2 ON p2.city_id = c2.id
       LEFT JOIN countries co1 ON p1.country_id = co1.id
       LEFT JOIN countries co2 ON p2.country_id = co2.id
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
          email: isUser1 ? match.user2_email : match.user1_email,
          birthDate: isUser1 ? match.user2_birth_date : match.user1_birth_date,
          city: isUser1 ? match.user2_city : match.user1_city,
          country: isUser1 ? match.user2_country : match.user1_country
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
