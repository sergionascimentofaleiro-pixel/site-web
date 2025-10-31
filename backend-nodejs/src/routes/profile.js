const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');
const { validateLength, LIMITS } = require('../middleware/validation');
const upload = require('../middleware/upload');

// All profile routes require authentication
router.use(authenticateToken);

router.post('/', validateLength({
  firstName: LIMITS.firstName,
  lastName: LIMITS.lastName,
  phone: LIMITS.phone,
  bio: LIMITS.bio,
  location: LIMITS.location
}), profileController.createProfile);
router.get('/me', profileController.getMyProfile);
router.get('/potential-matches', profileController.getPotentialMatches);
router.post('/swipe', profileController.swipe);

// Photo upload routes
router.post('/upload-photo', upload.single('photo'), profileController.uploadPhoto);
router.post('/update-photo-url', profileController.updatePhotoUrl);

module.exports = router;
