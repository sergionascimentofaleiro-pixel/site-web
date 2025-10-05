const Profile = require('../models/Profile');
const Like = require('../models/Like');

// Create or update profile
exports.createProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Accept both camelCase and snake_case
    const firstName = req.body.firstName || req.body.first_name;
    const lastName = req.body.lastName || req.body.last_name;
    const phone = req.body.phone;
    const birthDate = req.body.birthDate || req.body.birth_date;
    const gender = req.body.gender;
    const lookingFor = req.body.lookingFor || req.body.looking_for;
    const bio = req.body.bio;
    const location = req.body.location;
    const countryId = req.body.countryId || req.body.country_id;
    const stateId = req.body.stateId || req.body.state_id;
    const cityId = req.body.cityId || req.body.city_id;
    const interests = req.body.interests;
    const profilePhoto = req.body.profilePhoto || req.body.profile_photo;

    console.log('Received birthDate from frontend:', birthDate);

    // Validate required fields
    if (!firstName || !birthDate || !gender || !lookingFor) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Format birthDate to ensure it's stored correctly (YYYY-MM-DD only, no time/timezone)
    // This prevents MySQL from converting it to UTC timestamp
    const formattedBirthDate = birthDate.split('T')[0]; // Remove time part if present

    // Check if profile exists
    const existingProfile = await Profile.findByUserId(userId);

    const profileData = {
      firstName,
      lastName,
      phone,
      birthDate: formattedBirthDate,
      gender,
      lookingFor,
      bio,
      location,
      countryId: countryId || null,
      stateId: stateId || null,
      cityId: cityId || null,
      interests,
      profilePhoto
    };

    if (existingProfile) {
      // Update existing profile
      await Profile.update(userId, profileData);
      res.json({ message: 'Profile updated successfully' });
    } else {
      // Create new profile
      const profileId = await Profile.create({
        userId,
        ...profileData
      });
      res.status(201).json({ message: 'Profile created successfully', profileId });
    }
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user's profile
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await Profile.findByUserId(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Format birth_date to YYYY-MM-DD for HTML date input
    if (profile.birth_date) {
      console.log('Raw birth_date from DB:', profile.birth_date);
      // With dateStrings: true, it's already a string like "1979-06-13T00:00:00.000Z"
      // Just extract the date part
      profile.birth_date = profile.birth_date.split('T')[0];
      console.log('Formatted birth_date sent to frontend:', profile.birth_date);
    }

    // Get user email from users table
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (user) {
      profile.email = user.email;
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get potential matches
exports.getPotentialMatches = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;
    const language = req.query.lang || 'en';

    const matches = await Profile.getMatches(userId, limit, language);
    res.json(matches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Like or pass a profile
exports.swipe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetUserId, action } = req.body; // action: 'like' or 'pass'

    if (!targetUserId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['like', 'pass'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "like" or "pass"' });
    }

    const result = await Like.create(userId, targetUserId, action);

    res.json({
      message: 'Swipe recorded',
      isMatch: result.isMatch
    });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
