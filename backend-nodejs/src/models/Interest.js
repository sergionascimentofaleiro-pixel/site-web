const db = require('../config/database');

class Interest {
  // Get all interest categories with their interests
  static async getAllCategoriesWithInterests() {
    const [categories] = await db.query(`
      SELECT
        ic.category_id,
        ic.category_name,
        ic.category_icon,
        ic.display_order as category_order
      FROM interest_categories ic
      ORDER BY ic.display_order
    `);

    // Get all interests for each category
    for (let category of categories) {
      const [interests] = await db.query(`
        SELECT
          interest_id,
          interest_name,
          interest_icon,
          display_order
        FROM interests
        WHERE category_id = ?
        ORDER BY display_order
      `, [category.category_id]);

      category.interests = interests;
    }

    return categories;
  }

  // Get interests for a specific profile
  static async getProfileInterests(profileId) {
    const [interests] = await db.query(`
      SELECT
        i.interest_id,
        i.interest_name,
        i.interest_icon,
        ic.category_name,
        ic.category_icon
      FROM profile_interests pi
      JOIN interests i ON pi.interest_id = i.interest_id
      JOIN interest_categories ic ON i.category_id = ic.category_id
      WHERE pi.profile_id = ?
      ORDER BY ic.display_order, i.display_order
    `, [profileId]);

    return interests;
  }

  // Set interests for a profile (replace all existing)
  static async setProfileInterests(profileId, interestIds) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Delete existing interests
      await connection.query(
        'DELETE FROM profile_interests WHERE profile_id = ?',
        [profileId]
      );

      // Insert new interests
      if (interestIds && interestIds.length > 0) {
        const values = interestIds.map(interestId => [profileId, interestId]);
        await connection.query(
          'INSERT INTO profile_interests (profile_id, interest_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get matching profiles based on shared interests
  static async getMatchingProfiles(userId, minSharedInterests = 1) {
    const [matches] = await db.query(`
      SELECT
        p.user_id,
        p.first_name,
        COUNT(DISTINCT pi2.interest_id) as shared_interests
      FROM profiles my_profile
      JOIN profile_interests pi1 ON my_profile.id = pi1.profile_id
      JOIN profile_interests pi2 ON pi1.interest_id = pi2.interest_id
      JOIN profiles p ON pi2.profile_id = p.id
      WHERE my_profile.user_id = ?
        AND p.user_id != ?
      GROUP BY p.user_id, p.first_name
      HAVING shared_interests >= ?
      ORDER BY shared_interests DESC
    `, [userId, userId, minSharedInterests]);

    return matches;
  }
}

module.exports = Interest;
