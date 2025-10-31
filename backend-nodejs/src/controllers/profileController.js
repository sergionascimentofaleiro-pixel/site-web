const Profile = require('../models/Profile');
const Like = require('../models/Like');
const { generateSignedImageUrl } = require('../utils/imageSignature');
const { sanitizeProfileData } = require('../utils/sanitizer');
const logger = require('../utils/logger');

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

    logger.debug('Received birthDate from frontend:', { birthDate, userId });

    // Validate required fields
    if (!firstName || !birthDate || !gender || !lookingFor || !phone || !countryId || !cityId) {
      return res.status(400).json({ error: 'Missing required fields: first name, birth date, gender, looking for, phone, country and city are required' });
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

    // Sanitize all user inputs to prevent XSS
    const sanitizedData = sanitizeProfileData(profileData);

    if (existingProfile) {
      // Update existing profile
      await Profile.update(userId, sanitizedData);
      res.json({ message: 'Profile updated successfully' });
    } else {
      // Create new profile
      const profileId = await Profile.create({
        userId,
        ...sanitizedData
      });

      // Activate user account when profile is created
      const User = require('../models/User');
      await User.activate(userId);

      res.status(201).json({ message: 'Profile created successfully', profileId });
    }
  } catch (error) {
    logger.error('Profile creation error:', { error: error.message, userId: req.user.userId });
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
      logger.debug('Raw birth_date from DB:', { birthDate: profile.birth_date, userId });
      // Handle both Date objects (PostgreSQL) and strings (MySQL)
      if (profile.birth_date instanceof Date) {
        // PostgreSQL returns Date object
        profile.birth_date = profile.birth_date.toISOString().split('T')[0];
      } else if (typeof profile.birth_date === 'string') {
        // MySQL returns string
        profile.birth_date = profile.birth_date.split('T')[0];
      }
      logger.debug('Formatted birth_date sent to frontend:', { birthDate: profile.birth_date, userId });
    }

    // Get user email from users table
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (user) {
      profile.email = user.email;
    }

    // Generate signed URL for profile photo (only for local uploads)
    if (profile.profile_photo && profile.profile_photo.startsWith('/uploads/')) {
      profile.profile_photo = generateSignedImageUrl(profile.profile_photo, userId);
    }

    res.json(profile);
  } catch (error) {
    logger.error('Get profile error:', { error: error.message, userId: req.user.userId });
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

    // Generate signed URLs for profile photos (only for local uploads)
    const matchesWithSignedUrls = matches.map(match => {
      if (match.profile_photo && match.profile_photo.startsWith('/uploads/')) {
        match.profile_photo = generateSignedImageUrl(match.profile_photo, userId);
      }
      return match;
    });

    res.json(matchesWithSignedUrls);
  } catch (error) {
    logger.error('Get matches error:', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Like or pass a profile
exports.swipe = async (req, res) => {
  const userId = req.user.userId;
  const { targetUserId, action } = req.body; // action: 'like' or 'pass'

  try {
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
    // Handle duplicate entry error gracefully (user already swiped on this profile)
    // MySQL: ER_DUP_ENTRY, PostgreSQL: 23505 (unique_violation)
    if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
      logger.debug('User already swiped on profile (duplicate entry)', { userId, targetUserId });
      return res.json({
        message: 'Already swiped on this profile',
        isMatch: false
      });
    }

    logger.error('Swipe error:', { error: error.message, userId, targetUserId });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload profile photo
exports.uploadPhoto = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Construct photo URL
    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    // Update profile with new photo
    await Profile.updatePhoto(userId, photoUrl);

    // Generate signed URL for the response
    const signedUrl = generateSignedImageUrl(photoUrl, userId);

    res.json({
      success: true,
      photoUrl: signedUrl,
      message: 'Photo uploaded successfully'
    });
  } catch (error) {
    logger.error('Upload photo error:', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};

// Update profile photo URL (for external URLs)
exports.updatePhotoUrl = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: 'Photo URL is required' });
    }

    // Validate URL format
    try {
      new URL(photoUrl);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Update profile with new photo URL
    await Profile.updatePhoto(userId, photoUrl);

    res.json({
      success: true,
      photoUrl: photoUrl,
      message: 'Photo URL updated successfully'
    });
  } catch (error) {
    logger.error('Update photo URL error:', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Failed to update photo URL' });
  }
};
