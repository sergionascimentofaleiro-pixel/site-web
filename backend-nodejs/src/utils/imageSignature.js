const crypto = require('crypto');

// Secret key for signing URLs (should be in .env in production)
const SECRET_KEY = process.env.IMAGE_SIGNATURE_SECRET || 'your-secret-key-change-in-production';

// Token validity duration (15 minutes)
const TOKEN_VALIDITY_MS = 15 * 60 * 1000;

/**
 * Generate a signed token for an image URL
 * @param {string} imagePath - The path to the image (e.g., '/uploads/profiles/image.jpg')
 * @param {number} userId - The user ID requesting the image
 * @returns {object} - Object containing the signed token and expiration time
 */
function generateImageToken(imagePath, userId) {
  const expiresAt = Date.now() + TOKEN_VALIDITY_MS;

  // Create signature: HMAC of (imagePath + userId + expiresAt)
  const data = `${imagePath}:${userId}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('hex');

  // Encode token as base64 for URL safety
  const token = Buffer.from(`${signature}:${expiresAt}`).toString('base64url');

  return {
    token,
    expiresAt
  };
}

/**
 * Verify a signed image token
 * @param {string} token - The token to verify
 * @param {string} imagePath - The image path being requested
 * @param {number} userId - The user ID making the request
 * @returns {object} - Object with valid (boolean) and reason (string if invalid)
 */
function verifyImageToken(token, imagePath, userId) {
  try {
    // Decode token
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [signature, expiresAt] = decoded.split(':');

    // Check expiration
    if (Date.now() > parseInt(expiresAt)) {
      return { valid: false, reason: 'Token expired' };
    }

    // Recreate signature and compare
    const data = `${imagePath}:${userId}:${expiresAt}`;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(data)
      .digest('hex');

    if (signature !== expectedSignature) {
      return { valid: false, reason: 'Invalid signature' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'Malformed token' };
  }
}

/**
 * Generate a signed URL for an image
 * @param {string} imagePath - The path to the image
 * @param {number} userId - The user ID requesting the image
 * @returns {string} - The complete signed URL
 */
function generateSignedImageUrl(imagePath, userId) {
  if (!imagePath) return null;

  // If it's an external URL (http:// or https://), return as-is
  // External images don't need watermarking or token protection
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // For local images (/uploads/...), generate signed URL
  const { token } = generateImageToken(imagePath, userId);

  // Use absolute URL with BACKEND_URL to ensure images are fetched from backend
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const encodedPath = encodeURIComponent(imagePath);
  return `${backendUrl}/api/images/secure?path=${encodedPath}&token=${token}&userId=${userId}`;
}

module.exports = {
  generateImageToken,
  verifyImageToken,
  generateSignedImageUrl
};
