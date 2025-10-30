const db = require('../config/database');

class Like {
  static async create(fromUserId, toUserId, likeType) {
    const result = await db.execute(
      'INSERT INTO likes (from_user_id, to_user_id, like_type) VALUES (?, ?, ?)',
      [fromUserId, toUserId, likeType]
    );

    // Check if it's a match (both users liked each other)
    if (likeType === 'like') {
      const [existingLike] = await db.execute(
        "SELECT * FROM likes WHERE from_user_id = ? AND to_user_id = ? AND like_type = 'like'",
        [toUserId, fromUserId]
      );

      if (existingLike.length > 0) {
        // Create a match
        await this.createMatch(fromUserId, toUserId);
        return { insertId: result[0].insertId, isMatch: true };
      }
    }

    return { insertId: result[0].insertId, isMatch: false };
  }

  static async createMatch(user1Id, user2Id) {
    // Ensure user1_id < user2_id for consistency
    const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    // Use database-specific upsert syntax
    const isPostgres = db.dbType === 'postgres';
    const upsertQuery = isPostgres
      ? 'INSERT INTO matches (user1_id, user2_id) VALUES (?, ?) ON CONFLICT (user1_id, user2_id) DO UPDATE SET is_active = TRUE'
      : 'INSERT INTO matches (user1_id, user2_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE is_active = TRUE';

    await db.execute(upsertQuery, [smallerId, largerId]);
  }

  static async getLikesBetweenUsers(user1Id, user2Id) {
    const [rows] = await db.execute(
      'SELECT * FROM likes WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)',
      [user1Id, user2Id, user2Id, user1Id]
    );
    return rows;
  }
}

module.exports = Like;
