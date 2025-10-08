const db = require('../config/database');

class Profile {
  static async create(profileData) {
    const { userId, firstName, lastName, phone, birthDate, gender, lookingFor, bio, location, countryId, stateId, cityId, interests, profilePhoto } = profileData;
    const [result] = await db.execute(
      `INSERT INTO profiles (user_id, first_name, last_name, phone, birth_date, gender, looking_for, bio, location, country_id, state_id, city_id, interests, profile_photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, firstName, lastName, phone, birthDate, gender, lookingFor, bio, location, countryId, stateId, cityId, interests, profilePhoto]
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
    const { firstName, lastName, phone, birthDate, gender, lookingFor, bio, location, countryId, stateId, cityId, interests, profilePhoto } = profileData;
    await db.execute(
      `UPDATE profiles
       SET first_name = ?, last_name = ?, phone = ?, birth_date = ?, gender = ?, looking_for = ?,
           bio = ?, location = ?, country_id = ?, state_id = ?, city_id = ?, interests = ?, profile_photo = ?
       WHERE user_id = ?`,
      [firstName, lastName, phone, birthDate, gender, lookingFor, bio, location, countryId, stateId, cityId, interests, profilePhoto, userId]
    );
  }

  static async getMatches(userId, limit = 10, language = 'en') {
    // First, get the current user's profile to check their preferences
    const myProfile = await this.findByUserId(userId);

    if (!myProfile) {
      return [];
    }

    // Get my interests
    const [myInterests] = await db.execute(
      'SELECT interest_id FROM profile_interests WHERE profile_id = ?',
      [myProfile.id]
    );
    const myInterestIds = myInterests.map(i => i.interest_id);

    // Calculate my age
    const myAge = this.calculateAge(myProfile.birth_date);

    // Get my city coordinates
    const [myCityData] = await db.execute(
      'SELECT latitude, longitude FROM cities WHERE id = ?',
      [myProfile.city_id]
    );
    const myCoords = myCityData[0] || {};

    // Get profiles that match user's preferences and haven't been liked/passed yet
    const [rows] = await db.execute(
      `SELECT p.*, u.id as user_id,
       c.name as city_name,
       c.latitude as city_latitude,
       c.longitude as city_longitude,
       CASE
         WHEN ? = 'fr' THEN COALESCE(co.name_fr, co.name_en)
         WHEN ? = 'es' THEN COALESCE(co.name_es, co.name_en)
         WHEN ? = 'pt' THEN COALESCE(co.name_pt, co.name_en)
         ELSE co.name_en
       END as country_name,
       GROUP_CONCAT(
         CONCAT(
           COALESCE(it.translated_name, i.interest_name),
           '|',
           i.interest_icon
         ) SEPARATOR '||'
       ) as interests_with_icons,
       GROUP_CONCAT(DISTINCT pi.interest_id) as interest_ids
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN cities c ON p.city_id = c.id
       LEFT JOIN countries co ON p.country_id = co.id
       LEFT JOIN profile_interests pi ON p.id = pi.profile_id
       LEFT JOIN interests i ON pi.interest_id = i.interest_id
       LEFT JOIN interest_translations it
         ON i.interest_id = it.interest_id
         AND it.language_code = ?
       WHERE p.user_id != ?
       AND u.is_active = TRUE
       AND (
         ? = 'all' OR p.gender = ?
       )
       AND p.id NOT IN (
         SELECT to_user_id FROM likes WHERE from_user_id = ?
       )
       GROUP BY p.id, u.id, c.name, c.latitude, c.longitude, country_name`,
      [language, language, language, language, userId, myProfile.looking_for, myProfile.looking_for, userId]
    );

    // Calculate match score for each profile
    const profilesWithScore = rows.map(profile => {
      let score = 0;

      // Gender match (20 points)
      if (profile.gender === myProfile.looking_for || myProfile.looking_for === 'all') {
        score += 20;
      }

      // Age compatibility (20 points) - prefer similar age (±5 years = max score)
      const theirAge = this.calculateAge(profile.birth_date);
      const ageDiff = Math.abs(myAge - theirAge);
      if (ageDiff <= 5) {
        score += 20;
      } else if (ageDiff <= 10) {
        score += 15;
      } else if (ageDiff <= 15) {
        score += 10;
      } else if (ageDiff <= 20) {
        score += 5;
      }

      // Interest match (35 points max)
      // Each common interest adds points, but non-shared interests don't remove points
      if (profile.interest_ids && myInterestIds.length > 0) {
        const theirInterestIds = profile.interest_ids.split(',').map(id => parseInt(id));
        const commonInterests = theirInterestIds.filter(id => myInterestIds.includes(id));

        // Award points based on number of common interests (up to 35 points)
        // 1 common interest = 5 points, 2 = 10 points, 3 = 15 points, etc.
        // Maximum of 7 common interests considered (7 * 5 = 35 points)
        const interestPoints = Math.min(commonInterests.length * 5, 35);
        score += interestPoints;
      }

      // Geographic proximity - BONUS for very close proximity
      if (myCoords.latitude && myCoords.longitude && profile.city_latitude && profile.city_longitude) {
        const distance = this.calculateDistance(
          myCoords.latitude,
          myCoords.longitude,
          profile.city_latitude,
          profile.city_longitude
        );

        if (distance !== null) {
          profile.distance_km = distance;

          // Super proximity bonus (< 20km = 20 points!)
          if (distance < 20) {
            score += 20;
          }
          // Distance scoring: 20-50km = 12pts, 50-100km = 9pts, 100-200km = 6pts, 200-500km = 3pts
          else if (distance <= 50) {
            score += 12;
          } else if (distance <= 100) {
            score += 9;
          } else if (distance <= 200) {
            score += 6;
          } else if (distance <= 500) {
            score += 3;
          }
        }
      }

      profile.match_percentage = Math.min(score, 100);
      return profile;
    });

    // Sort by match percentage (descending) and limit
    profilesWithScore.sort((a, b) => b.match_percentage - a.match_percentage);
    return profilesWithScore.slice(0, limit);
  }

  // Calculate distance between two coordinates using Haversine formula (in km)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return Math.round(distance); // Return distance in km, rounded
  }

  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  static async delete(userId) {
    await db.execute('DELETE FROM profiles WHERE user_id = ?', [userId]);
  }

  static async updatePhoto(userId, photoUrl) {
    await db.execute(
      'UPDATE profiles SET profile_photo = ? WHERE user_id = ?',
      [photoUrl, userId]
    );
  }
}

module.exports = Profile;
