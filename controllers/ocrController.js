/**
 * OCR Controller - Proxy API để xử lý OCR từ ảnh
 * Bảo mật API key bằng cách xử lý ở backend
 */

const FormData = require('form-data');

// OCR Configuration from environment
const OCR_CONFIG = {
    apiUrl: process.env.OCR_API_URL || 'https://apio-v1.onrender.com/api/ocr/process',
    apiKey: process.env.OCR_API_KEY || '',
    defaultLanguage: 'vie',
    defaultOutputFormat: 'text',
    defaultProvider: 'gemini'
};
console.log("OCR_CONFIG", OCR_CONFIG);
/**
 * Process OCR from uploaded image
 * POST /api/ocr/process
 */
exports.processOCR = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng upload file ảnh'
            });
        }

        // Get options from request body
        const {
            language = OCR_CONFIG.defaultLanguage,
            outputFormat = OCR_CONFIG.defaultOutputFormat,
            provider = OCR_CONFIG.defaultProvider
        } = req.body;

        // Check API key
        if (!OCR_CONFIG.apiKey) {
            console.error('OCR API Key not configured');
            return res.status(500).json({
                success: false,
                message: 'OCR service không được cấu hình đúng'
            });
        }

        // Create FormData for API request
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });
        formData.append('language', language);
        formData.append('outputFormat', outputFormat);
        formData.append('provider', provider);

        // Call OCR API using axios
        const axios = require('axios');
        const response = await axios.post(OCR_CONFIG.apiUrl, formData, {
            headers: {
                'Accept': 'application/json',
                'x-api-key': OCR_CONFIG.apiKey,
                ...formData.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        const result = response.data;

        // Process and return result
        if (result.success && result.data?.results?.length > 0) {
            const ocrResult = result.data.results[0];

            // Xử lý text: convert literal \\n thành newline thực sự
            let processedText = ocrResult.text || '';
            processedText = processedText.replace(/\\n/g, '\n');

            return res.json({
                success: true,
                data: {
                    text: processedText,
                    confidence: ocrResult.confidence,
                    provider: ocrResult.provider,
                    processingTime: ocrResult.processingTime
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: result.message || 'Không thể đọc được nội dung từ ảnh'
            });
        }

    } catch (error) {
        console.error('OCR Controller Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xử lý OCR: ' + error.message
        });
    }
};
