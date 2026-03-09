const cloudinary = require('cloudinary').v2;
require('dotenv').config(); // Ensure dotenv is loaded before config

cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim()
});

console.log('☁️ Cloudinary Configured for:', cloudinary.config().cloud_name);

module.exports = cloudinary;
