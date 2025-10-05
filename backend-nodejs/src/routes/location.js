const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// Public routes (locations can be viewed without authentication)
router.get('/countries', locationController.getAllCountries);
router.get('/countries/:countryId/states', locationController.getStatesByCountry);
router.get('/cities', locationController.getCities);
router.get('/cities/search', locationController.searchCities);
router.get('/cities/:cityId', locationController.getCityDetails);

module.exports = router;
