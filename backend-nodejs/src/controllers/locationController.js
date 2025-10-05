const Location = require('../models/Location');

// Get all countries
exports.getAllCountries = async (req, res) => {
  try {
    const language = req.query.lang || 'en';
    const countries = await Location.getAllCountries(language);
    res.json(countries);
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get states by country ID
exports.getStatesByCountry = async (req, res) => {
  try {
    const { countryId } = req.params;
    const states = await Location.getStatesByCountry(countryId);
    res.json(states);
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get cities by country or state
exports.getCities = async (req, res) => {
  try {
    const { countryId, stateId } = req.query;

    if (!countryId) {
      return res.status(400).json({ error: 'Country ID is required' });
    }

    let cities;
    if (stateId) {
      // Get cities for a specific state
      cities = await Location.getCitiesByState(stateId);
    } else {
      // Get cities for countries without states
      cities = await Location.getCitiesByCountry(countryId);
    }

    res.json(cities);
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get city details
exports.getCityDetails = async (req, res) => {
  try {
    const { cityId } = req.params;
    const city = await Location.getCityDetails(cityId);

    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    res.json(city);
  } catch (error) {
    console.error('Get city details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search cities (autocomplete)
exports.searchCities = async (req, res) => {
  try {
    const { q, countryId, stateId, limit } = req.query;

    if (!q || q.length < 1) {
      return res.json([]);
    }

    const cities = await Location.searchCities(
      q,
      countryId || null,
      stateId || null,
      limit ? parseInt(limit) : 500
    );

    res.json(cities);
  } catch (error) {
    console.error('Search cities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
