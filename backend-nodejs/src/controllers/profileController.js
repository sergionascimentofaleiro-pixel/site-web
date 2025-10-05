const Profile = require('../models/Profile');
const Like = require('../models/Like');

// Create or update profile
exports.createProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, birthDate, gender, lookingFor, bio, location, interests, profilePhoto } = req.body;

    // Validate required fields
    if (!firstName || !birthDate || !gender || !lookingFor) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if profile exists
    const existingProfile = await Profile.findByUserId(userId);

    if (existingProfile) {
      // Update existing profile
      await Profile.update(userId, req.body);
      res.json({ message: 'Profile updated successfully' });
    } else {
      // Create new profile
      const profileId = await Profile.create({
        userId,
        firstName,
        birthDate,
        gender,
        lookingFor,
        bio,
        location,
        interests,
        profilePhoto
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

    const matches = await Profile.getMatches(userId, limit);
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
