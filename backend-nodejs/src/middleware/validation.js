/**
 * Input validation middleware
 * Prevents excessively long inputs that could cause DoS
 */

const logger = require('../utils/logger');

/**
 * Validate request body field lengths
 * @param {Object} limits - Object mapping field names to max lengths
 * @returns {Function} Express middleware
 */
function validateLength(limits) {
  return (req, res, next) => {
    try {
      for (const [field, maxLength] of Object.entries(limits)) {
        const value = req.body[field];

        if (value && typeof value === 'string' && value.length > maxLength) {
          logger.warn('Input length validation failed', {
            field,
            length: value.length,
            maxLength,
            userId: req.user?.userId
          });

          return res.status(400).json({
            error: `Field '${field}' exceeds maximum length of ${maxLength} characters`
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Validation error:', { error: error.message });
      res.status(500).json({ error: 'Validation error' });
    }
  };
}

/**
 * Validate JSON body size
 * Already handled by express.json({ limit: '10mb' }) but adding explicit check
 */
function validateBodySize(maxSizeBytes = 1024 * 1024) { // 1MB default
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');

    if (contentLength > maxSizeBytes) {
      logger.warn('Request body too large', { contentLength, maxSizeBytes });
      return res.status(413).json({ error: 'Request body too large' });
    }

    next();
  };
}

/**
 * Common validation limits
 */
const LIMITS = {
  message: 2000,        // Messages
  bio: 500,             // Profile bio
  firstName: 50,        // Names
  lastName: 50,
  phone: 20,            // Phone numbers
  email: 100,           // Email addresses
  password: 128,        // Passwords
  location: 100         // Location strings
};

module.exports = {
  validateLength,
  validateBodySize,
  LIMITS
};
