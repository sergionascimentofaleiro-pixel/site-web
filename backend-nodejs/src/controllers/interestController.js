const Interest = require('../models/Interest');

// Get all interest categories with their interests
exports.getAllInterests = async (req, res) => {
  try {
    const language = req.query.lang || 'en';
    const categories = await Interest.getAllCategoriesWithInterests(language);
    res.json(categories);
  } catch (error) {
    console.error('Get interests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get interests for current user's profile
exports.getMyInterests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const language = req.query.lang || 'en';

    // First get the profile id
    const Profile = require('../models/Profile');
    const profile = await Profile.findByUserId(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const interests = await Interest.getProfileInterests(profile.id, language);
    res.json(interests);
  } catch (error) {
    console.error('Get my interests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Set interests for current user's profile
exports.setMyInterests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { interestIds } = req.body;

    if (!Array.isArray(interestIds)) {
      return res.status(400).json({ error: 'interestIds must be an array' });
    }

    // Get the profile id
    const Profile = require('../models/Profile');
    const profile = await Profile.findByUserId(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found. Create a profile first.' });
    }

    await Interest.setProfileInterests(profile.id, interestIds);
    res.json({ message: 'Interests updated successfully' });
  } catch (error) {
    console.error('Set interests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
