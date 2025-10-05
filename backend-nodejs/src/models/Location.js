const db = require('../config/database');

class Location {
  // Get all countries with translations
  static async getAllCountries(language = 'en') {
    const langColumn = ['en', 'fr', 'es', 'pt'].includes(language) ? `name_${language}` : 'name_en';

    const [rows] = await db.query(
      `SELECT id, code, ${langColumn} as name, has_states
       FROM countries
       ORDER BY ${langColumn}`
    );
    return rows;
  }

  // Get country by ID
  static async getCountryById(id, language = 'en') {
    const langColumn = ['en', 'fr', 'es', 'pt'].includes(language) ? `name_${language}` : 'name_en';

    const [rows] = await db.query(
      `SELECT id, code, ${langColumn} as name, has_states
       FROM countries
       WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  // Get states by country ID
  static async getStatesByCountry(countryId) {
    const [rows] = await db.query(
      `SELECT id, code, name
       FROM states
       WHERE country_id = ?
       ORDER BY name`,
      [countryId]
    );
    return rows;
  }

  // Get cities by country ID (for countries without states)
  static async getCitiesByCountry(countryId) {
    const [rows] = await db.query(
      `SELECT id, name
       FROM cities
       WHERE country_id = ? AND state_id IS NULL
       ORDER BY name`,
      [countryId]
    );
    return rows;
  }

  // Get cities by state ID (for countries with states)
  static async getCitiesByState(stateId) {
    const [rows] = await db.query(
      `SELECT id, name
       FROM cities
       WHERE state_id = ?
       ORDER BY name`,
      [stateId]
    );
    return rows;
  }

  // Get city details with country and state
  static async getCityDetails(cityId) {
    const [rows] = await db.query(
      `SELECT c.id, c.name as city_name,
              co.id as country_id, co.code as country_code, co.name_en as country_name,
              s.id as state_id, s.code as state_code, s.name as state_name
       FROM cities c
       INNER JOIN countries co ON c.country_id = co.id
       LEFT JOIN states s ON c.state_id = s.id
       WHERE c.id = ?`,
      [cityId]
    );
    return rows[0];
  }
}

module.exports = Location;
