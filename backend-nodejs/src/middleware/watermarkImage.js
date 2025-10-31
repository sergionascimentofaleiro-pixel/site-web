const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Add watermark to image using Sharp
 * @param {Buffer} imageBuffer - The original image buffer
 * @returns {Promise<Buffer>} - The watermarked image buffer
 */
async function addWatermark(imageBuffer) {
  try {
    // Get image metadata
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Calculate watermark size based on image dimensions
    // Target: watermark should be ~100px when displayed at 500px height (discover page)
    // Watermark should be ~20% of the image height (100/500 = 0.20)
    const targetWatermarkRatio = 0.20;
    const watermarkSize = Math.round(metadata.height * targetWatermarkRatio);

    // Ensure minimum size
    const baseSize = Math.max(watermarkSize, 120);

    // Adjust dimensions: +3.5% width (was -10%, increased by 15%), -20% height
    const finalWatermarkWidth = Math.round(baseSize * 1.035);
    const finalWatermarkHeight = Math.round(baseSize * 0.8);

    // Scale text and logo proportionally - centered
    const centerY = finalWatermarkHeight / 2;

    // Adjusted sizes and positions for proper centering
    const logoSize = finalWatermarkHeight * 0.38;
    const textSize = finalWatermarkHeight * 0.14;
    const borderRadius = finalWatermarkHeight * 0.25;

    // Create SVG watermark with hearts logo and text
    // Add margin to shift content left (compensate for right alignment issue)
    const rightMargin = finalWatermarkWidth * 0.15; // 15% margin on the right
    const contentCenterX = (finalWatermarkWidth - rightMargin) / 2;

    const logoYPos = centerY - (finalWatermarkHeight * 0.08);
    const textYPos = centerY + (finalWatermarkHeight * 0.3);

    const watermarkSvg = `
      <svg width="${finalWatermarkWidth}" height="${finalWatermarkHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .logo { font-family: "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", "DejaVu Sans", sans-serif; }
            .text { font-family: "Liberation Serif", Georgia, "DejaVu Serif", serif; }
          </style>
        </defs>
        <path d="M ${borderRadius} 0
                 L ${finalWatermarkWidth} 0
                 L ${finalWatermarkWidth} ${finalWatermarkHeight}
                 L 0 ${finalWatermarkHeight}
                 L 0 ${borderRadius}
                 Q 0 0 ${borderRadius} 0"
              fill="white" opacity="1" />
        <text class="logo" x="${contentCenterX}" y="${logoYPos}" font-size="${logoSize}" text-anchor="middle" dominant-baseline="middle" fill="#e94560">💕</text>
        <text class="text" x="${contentCenterX}" y="${textYPos}" font-size="${textSize}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#e94560" letter-spacing="0.5">curvy.com</text>
      </svg>
    `;

    // Position watermark at bottom-right corner
    const watermarkBuffer = Buffer.from(watermarkSvg);

    // Composite the watermark onto the image
    const watermarkedImage = await image
      .composite([
        {
          input: watermarkBuffer,
          gravity: 'southeast' // Bottom-right corner
        }
      ])
      .jpeg({ quality: 85 }) // Maintain good quality
      .toBuffer();

    return watermarkedImage;
  } catch (error) {
    console.error('Error adding watermark:', error);
    // Return original image if watermarking fails
    return imageBuffer;
  }
}

/**
 * Middleware to serve images with watermark
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Buffer>} - Watermarked image buffer
 */
async function getWatermarkedImage(imagePath) {
  try {
    // Resolve full path
    const fullPath = path.join(__dirname, '../../', imagePath);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      throw new Error('Image not found');
    }

    // Read the image file
    const imageBuffer = await fs.readFile(fullPath);

    // Add watermark
    const watermarkedBuffer = await addWatermark(imageBuffer);

    return watermarkedBuffer;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

module.exports = {
  addWatermark,
  getWatermarkedImage
};
