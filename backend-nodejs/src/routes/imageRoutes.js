const express = require('express');
const router = express.Router();
const { verifyImageToken } = require('../utils/imageSignature');
const { getWatermarkedImage } = require('../middleware/watermarkImage');

/**
 * Serve secure watermarked images with token validation
 * GET /api/images/secure?path=/uploads/...&token=xxx&userId=xxx
 */
router.get('/secure', async (req, res) => {
  try {
    const { path: imagePath, token, userId } = req.query;

    // Validate required parameters
    if (!imagePath || !token || !userId) {
      return res.status(400).json({ error: 'Missing path, token, or userId' });
    }

    // Verify token
    const verification = verifyImageToken(token, imagePath, parseInt(userId));

    if (!verification.valid) {
      return res.status(403).json({ error: verification.reason });
    }

    // Get watermarked image
    const watermarkedImage = await getWatermarkedImage(imagePath);

    // Set appropriate headers
    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
      'X-Content-Type-Options': 'nosniff'
    });

    // Send image
    res.send(watermarkedImage);
  } catch (error) {
    console.error('Error serving secure image:', error);

    if (error.message === 'Image not found') {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.status(500).json({ error: 'Failed to serve image' });
  }
});

module.exports = router;
