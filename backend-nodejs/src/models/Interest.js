const db = require('../config/database');

class Interest {
  // Get all interest categories with their interests
  static async getAllCategoriesWithInterests(language = 'en') {
    const [categories] = await db.query(`
      SELECT
        ic.category_id,
        COALESCE(ict.translated_name, ic.category_name) as category_name,
        ic.category_icon,
        ic.display_order as category_order
      FROM interest_categories ic
      LEFT JOIN interest_category_translations ict
        ON ic.category_id = ict.category_id
        AND ict.language_code = ?
      ORDER BY ic.display_order
    `, [language]);

    // Get all interests for each category
    for (let category of categories) {
      const [interests] = await db.query(`
        SELECT
          i.interest_id,
          COALESCE(it.translated_name, i.interest_name) as interest_name,
          i.interest_icon,
          i.display_order
        FROM interests i
        LEFT JOIN interest_translations it
          ON i.interest_id = it.interest_id
          AND it.language_code = ?
        WHERE i.category_id = ?
        ORDER BY i.display_order
      `, [language, category.category_id]);

      category.interests = interests;
    }

    return categories;
  }

  // Get interests for a specific profile
  static async getProfileInterests(profileId, language = 'en') {
    const [interests] = await db.query(`
      SELECT
        i.interest_id,
        COALESCE(it.translated_name, i.interest_name) as interest_name,
        i.interest_icon,
        COALESCE(ict.translated_name, ic.category_name) as category_name,
        ic.category_icon
      FROM profile_interests pi
      JOIN interests i ON pi.interest_id = i.interest_id
      JOIN interest_categories ic ON i.category_id = ic.category_id
      LEFT JOIN interest_translations it
        ON i.interest_id = it.interest_id
        AND it.language_code = ?
      LEFT JOIN interest_category_translations ict
        ON ic.category_id = ict.category_id
        AND ict.language_code = ?
      WHERE pi.profile_id = ?
      ORDER BY ic.display_order, i.display_order
    `, [language, language, profileId]);

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
