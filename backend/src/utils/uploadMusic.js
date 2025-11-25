const cloudinary = require('../config/cloudinary');
const fs = require('fs');

/**
 * Uploads a single mp3 file to Cloudinary.
 * @param {string} filePath - Local path to the mp3 file.
 * @param {string} folder - Cloudinary folder to upload to (optional).
 * @returns {Promise<object>} - Cloudinary upload result.
 */
const uploadMp3ToCloudinary = async (filePath, folder = 'mindful-map/music') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video', 
      folder,
    });
    fs.unlink(filePath, () => {});
    return result;
  } catch (error) {
    throw new Error('Cloudinary upload failed: ' + error.message);
  }
};

/**
 * Uploads multiple mp3 files to Cloudinary.
 * @param {string[]} filePaths - Array of local mp3 file paths.
 * @param {string} folder - Cloudinary folder to upload to (optional).
 * @returns {Promise<object[]>} - Array of Cloudinary upload results.
 */
const uploadMultipleMp3s = async (filePaths, folder = 'mindful-map/music') => {
  const results = [];
  for (const filePath of filePaths) {
    const result = await uploadMp3ToCloudinary(filePath, folder);
    results.push(result);
  }
  return results;
};

module.exports = {
  uploadMp3ToCloudinary,
  uploadMultipleMp3s,
};