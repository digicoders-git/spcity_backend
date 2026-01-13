require('dotenv').config();
const cloudinary = require('./config/cloudinary');

console.log('🔍 Testing Cloudinary Configuration...\n');

console.log('Environment Variables:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '***SET***' : 'MISSING');

console.log('\n☁️ Cloudinary Config Object:');
console.log(cloudinary.config());

console.log('\n✅ Cloudinary is configured!');
console.log('You can now upload images to folder: sp-city/projects');
