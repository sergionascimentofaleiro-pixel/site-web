const db = require('../config/database');

class Profile {
  static async create(profileData) {
    const { userId, firstName, birthDate, gender, lookingFor, bio, location, interests, profilePhoto } = profileData;
    const [result] = await db.execute(
      `INSERT INTO profiles (user_id, first_name, birth_date, gender, looking_for, bio, location, interests, profile_photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, firstName, birthDate, gender, lookingFor, bio, location, interests, profilePhoto]
    );
    return result.insertId;
  }

  static async findByUserId(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM profiles WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async update(userId, profileData) {
    const { firstName, birthDate, gender, lookingFor, bio, location, interests, profilePhoto } = profileData;
    await db.execute(
      `UPDATE profiles
       SET first_name = ?, birth_date = ?, gender = ?, looking_for = ?,
           bio = ?, location = ?, interests = ?, profile_photo = ?
       WHERE user_id = ?`,
      [firstName, birthDate, gender, lookingFor, bio, location, interests, profilePhoto, userId]
    );
  }

  static async getMatches(userId, limit = 10) {
    // Get profiles that match user's preferences and haven't been liked/passed yet
    const [rows] = await db.execute(
      `SELECT p.*, u.id as user_id
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id != ?
       AND u.is_active = TRUE
       AND p.id NOT IN (
         SELECT to_user_id FROM likes WHERE from_user_id = ?
       )
       ORDER BY RAND()
       LIMIT ?`,
      [userId, userId, limit]
    );
    return rows;
  }

  static async delete(userId) {
    await db.execute('DELETE FROM profiles WHERE user_id = ?', [userId]);
  }
}

module.exports = Profile;
