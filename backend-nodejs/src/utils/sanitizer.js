const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// Create a DOMPurify instance for Node.js
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - The input to sanitize
 * @param {Object} options - DOMPurify options
 * @returns {string} - Sanitized string
 */
function sanitizeInput(input, options = {}) {
  // Accept empty strings, reject null/undefined
  if (input === null || input === undefined || typeof input !== 'string') {
    return '';
  }

  // Default configuration: strip all HTML tags
  const defaultConfig = {
    ALLOWED_TAGS: [], // No HTML tags allowed by default
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content, remove tags
    ...options
  };

  return DOMPurify.sanitize(input.trim(), defaultConfig);
}

/**
 * Sanitize text while allowing basic formatting (for bio/descriptions)
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized string with basic formatting
 */
function sanitizeText(input) {
  // Accept empty strings, reject null/undefined
  if (input === null || input === undefined || typeof input !== 'string') {
    return '';
  }

  // Allow only safe formatting tags
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}

/**
 * Sanitize a message (plain text only, no HTML)
 * @param {string} message - The message to sanitize
 * @returns {string} - Sanitized message
 */
function sanitizeMessage(message) {
  return sanitizeInput(message);
}

/**
 * Sanitize user profile data
 * @param {Object} profileData - The profile data to sanitize
 * @returns {Object} - Sanitized profile data
 */
function sanitizeProfileData(profileData) {
  const sanitized = {};

  // Sanitize text fields (no HTML) - preserve even if empty string
  // Support both camelCase and snake_case
  const textFieldsMap = {
    firstName: 'firstName',
    first_name: 'first_name',
    lastName: 'lastName',
    last_name: 'last_name',
    phone: 'phone',
    location: 'location'
  };

  Object.keys(textFieldsMap).forEach(field => {
    if (profileData[field] !== undefined && profileData[field] !== null) {
      sanitized[field] = sanitizeInput(profileData[field]);
    }
  });

  // Sanitize bio (allow basic formatting) - preserve even if empty
  if (profileData.bio !== undefined && profileData.bio !== null) {
    sanitized.bio = sanitizeText(profileData.bio);
  }

  // Pass through other fields unchanged (validated separately)
  // Support both camelCase and snake_case
  const safeFields = [
    'birthDate', 'birth_date', 'gender', 'lookingFor', 'looking_for',
    'profilePhoto', 'profile_photo', 'countryId', 'country_id',
    'stateId', 'state_id', 'cityId', 'city_id', 'interests'
  ];
  safeFields.forEach(field => {
    if (profileData[field] !== undefined) {
      sanitized[field] = profileData[field];
    }
  });

  return sanitized;
}

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const sanitized = sanitizeInput(email);

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return null;
  }

  return sanitized.toLowerCase();
}

module.exports = {
  sanitizeInput,
  sanitizeText,
  sanitizeMessage,
  sanitizeProfileData,
  sanitizeEmail
};
