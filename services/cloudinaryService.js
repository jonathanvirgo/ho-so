/**
 * Cloudinary Service - Upload and manage patient photos
 */
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

// Configure Cloudinary from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const cloudinaryService = {
    /**
     * Upload photo to Cloudinary
     * Converts to WebP format for optimization while keeping user's crop dimensions
     * @param {Buffer} buffer - Image buffer
     * @param {number|string} patientId - Patient ID for naming
     * @returns {Promise<object>} Cloudinary upload result
     */
    async uploadPhoto(buffer, patientId) {
        try {
            // Convert to WebP for size optimization (keeps original dimensions)
            const optimized = await sharp(buffer)
                .webp({ quality: 75 })
                .toBuffer();

            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'patients',
                        public_id: `patient_${patientId}_${Date.now()}`,
                        resource_type: 'image',
                        format: 'webp'
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );
                uploadStream.end(optimized);
            });
        } catch (error) {
            console.error('Image optimization error:', error);
            throw error;
        }
    },

    /**
     * Delete photo from Cloudinary
     * @param {string} publicId - Cloudinary public ID
     * @returns {Promise<object>} Deletion result
     */
    async deletePhoto(publicId) {
        if (!publicId) return null;
        try {
            return await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Cloudinary delete error:', error);
            throw error;
        }
    },

    /**
     * Get optimized thumbnail URL
     * @param {string} url - Original Cloudinary URL
     * @param {number} size - Thumbnail size
     * @returns {string} Transformed URL
     */
    getThumbnailUrl(url, size = 100) {
        if (!url) return '';
        // Insert transformation before upload path
        return url.replace('/upload/', `/upload/c_fill,w_${size},h_${size}/`);
    }
};

module.exports = cloudinaryService;
