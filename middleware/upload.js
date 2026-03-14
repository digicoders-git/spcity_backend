const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    
    // Support common document mimetypes
    const isImage = file.mimetype.startsWith('image/');
    const isPDF = file.mimetype === 'application/pdf';
    const isDoc = file.mimetype === 'application/msword' || 
                  file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (extname || isImage || isPDF || isDoc) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPG, PNG), PDFs and MS Word documents are allowed.'));
    }
  }
});

module.exports = upload;
