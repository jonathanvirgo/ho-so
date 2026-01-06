var express = require('express');
var ocrController = require('../controllers/ocrController');
var router = express.Router();
const multer = require('multer');

// Multer config for OCR file upload (memory storage)
const ocrUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh!'), false);
        }
    }
});

// OCR Processing Route
router.post('/ocr/process', ocrUpload.single('file'), ocrController.processOCR);

module.exports = router;
