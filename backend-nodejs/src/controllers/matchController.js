const Match = require('../models/Match');
const { generateSignedImageUrl } = require('../utils/imageSignature');
const logger = require('../utils/logger');

// Get all matches for current user
exports.getMatches = async (req, res) => {
  try {
    const userId = req.user.userId;
    const matches = await Match.getMatches(userId);

    // Generate signed URLs for profile photos (only for local uploads)
    const matchesWithSignedUrls = matches.map(match => {
      if (match.otherUser && match.otherUser.photo && match.otherUser.photo.startsWith('/uploads/')) {
        match.otherUser.photo = generateSignedImageUrl(match.otherUser.photo, userId);
      }
      return match;
    });

    res.json(matchesWithSignedUrls);
  } catch (error) {
    logger.error('Get matches error:', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Unmatch with a user
exports.unmatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.userId;

    // Verify the match belongs to the user
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.user1_id !== userId && match.user2_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Match.unmatch(matchId);
    res.json({ message: 'Unmatched successfully' });
  } catch (error) {
    logger.error('Unmatch error:', { error: error.message, matchId: req.params.matchId, userId: req.user.userId });
    res.status(500).json({ error: 'Internal server error' });
  }
};
