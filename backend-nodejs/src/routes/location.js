const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { apiLimiter } = require('../middleware/rateLimiter');

// Public routes with rate limiting (for registration flow)
router.use(apiLimiter);

router.get('/countries', locationController.getAllCountries);
router.get('/countries/:countryId/states', locationController.getStatesByCountry);
router.get('/cities', locationController.getCities);
router.get('/cities/search', locationController.searchCities);
router.get('/cities/:cityId', locationController.getCityDetails);

module.exports = router;
