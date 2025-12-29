const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp'); // For image processing
const commonService = require('../services/commonService');
const securityService = require('../services/securityService');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/survey-files');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
        
        cb(null, `${sanitizedName}_${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Define allowed file types
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files per request
    }
});

const fileUploadController = {
    /**
     * Upload single file
     */
    uploadSingle: async (req, res) => {
        const uploadSingle = upload.single('file');
        
        uploadSingle(req, res, async (err) => {
            const resultData = {
                success: false,
                message: '',
                data: null
            };
            
            try {
                if (err) {
                    if (err instanceof multer.MulterError) {
                        if (err.code === 'LIMIT_FILE_SIZE') {
                            resultData.message = 'File size too large. Maximum 10MB allowed.';
                        } else if (err.code === 'LIMIT_FILE_COUNT') {
                            resultData.message = 'Too many files. Maximum 5 files allowed.';
                        } else {
                            resultData.message = `Upload error: ${err.message}`;
                        }
                    } else {
                        resultData.message = err.message || 'Upload failed';
                    }
                    return res.json(resultData);
                }
                
                if (!req.file) {
                    resultData.message = 'No file uploaded';
                    return res.json(resultData);
                }
                
                const user = req.user;
                const surveyId = req.body.survey_id;
                
                // Process the uploaded file
                const fileData = await fileUploadController.processUploadedFile(req.file, user, surveyId);
                
                resultData.success = true;
                resultData.message = 'File uploaded successfully';
                resultData.data = fileData;
                
                res.json(resultData);
            } catch (error) {
                console.error('Error in uploadSingle:', error.message);
                resultData.message = 'Upload processing failed';
                res.json(resultData);
            }
        });
    },
    
    /**
     * Upload multiple files
     */
    uploadMultiple: async (req, res) => {
        const uploadMultiple = upload.array('files', 5);
        
        uploadMultiple(req, res, async (err) => {
            const resultData = {
                success: false,
                message: '',
                data: []
            };
            
            try {
                if (err) {
                    if (err instanceof multer.MulterError) {
                        if (err.code === 'LIMIT_FILE_SIZE') {
                            resultData.message = 'One or more files are too large. Maximum 10MB per file.';
                        } else if (err.code === 'LIMIT_FILE_COUNT') {
                            resultData.message = 'Too many files. Maximum 5 files allowed.';
                        } else {
                            resultData.message = `Upload error: ${err.message}`;
                        }
                    } else {
                        resultData.message = err.message || 'Upload failed';
                    }
                    return res.json(resultData);
                }
                
                if (!req.files || req.files.length === 0) {
                    resultData.message = 'No files uploaded';
                    return res.json(resultData);
                }
                
                const user = req.user;
                const surveyId = req.body.survey_id;
                
                // Process all uploaded files
                const processedFiles = [];
                for (const file of req.files) {
                    try {
                        const fileData = await fileUploadController.processUploadedFile(file, user, surveyId);
                        processedFiles.push(fileData);
                    } catch (error) {
                        console.error(`Error processing file ${file.originalname}:`, error.message);
                        processedFiles.push({
                            originalName: file.originalname,
                            error: error.message
                        });
                    }
                }
                
                resultData.success = true;
                resultData.message = `${processedFiles.length} files processed`;
                resultData.data = processedFiles;
                
                res.json(resultData);
            } catch (error) {
                console.error('Error in uploadMultiple:', error.message);
                resultData.message = 'Upload processing failed';
                res.json(resultData);
            }
        });
    },
    
    /**
     * Process uploaded file
     */
    processUploadedFile: async (file, user, surveyId) => {
        try {
            // Generate file hash for deduplication
            const fileBuffer = fs.readFileSync(file.path);
            const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
            
            // Create thumbnail for images
            let thumbnailPath = null;
            if (file.mimetype.startsWith('image/')) {
                thumbnailPath = await fileUploadController.createThumbnail(file.path);
            }
            
            // Save file info to database
            const fileRecord = {
                id: commonService.generateUUID(),
                original_name: file.originalname,
                filename: file.filename,
                file_path: file.path,
                thumbnail_path: thumbnailPath,
                mime_type: file.mimetype,
                file_size: file.size,
                file_hash: fileHash,
                survey_id: surveyId || null,
                uploaded_by: user.id,
                created_at: new Date(),
                updated_at: new Date()
            };
            
            const saveResult = await commonService.insertRecordTable(fileRecord, 'uploaded_files');
            
            if (!saveResult.success) {
                throw new Error('Failed to save file record to database');
            }
            
            return {
                id: fileRecord.id,
                originalName: file.originalname,
                filename: file.filename,
                mimeType: file.mimetype,
                size: file.size,
                hash: fileHash,
                thumbnailUrl: thumbnailPath ? `/uploads/thumbnails/${path.basename(thumbnailPath)}` : null,
                downloadUrl: `/api/files/${fileRecord.id}/download`,
                createdAt: fileRecord.created_at
            };
        } catch (error) {
            // Clean up uploaded file if processing fails
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw error;
        }
    },
    
    /**
     * Create thumbnail for images
     */
    createThumbnail: async (imagePath) => {
        try {
            const thumbnailDir = path.join(__dirname, '../uploads/thumbnails');
            
            // Create thumbnail directory if it doesn't exist
            if (!fs.existsSync(thumbnailDir)) {
                fs.mkdirSync(thumbnailDir, { recursive: true });
            }
            
            const filename = path.basename(imagePath);
            const thumbnailPath = path.join(thumbnailDir, `thumb_${filename}`);
            
            // Create thumbnail using Sharp
            await sharp(imagePath)
                .resize(200, 200, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 80 })
                .toFile(thumbnailPath);
            
            return thumbnailPath;
        } catch (error) {
            console.error('Error creating thumbnail:', error.message);
            return null;
        }
    },
    
    /**
     * Download file
     */
    downloadFile: async (req, res) => {
        try {
            const fileId = req.params.fileId;
            const user = req.user;
            
            // Get file record from database
            const fileResponse = await commonService.getAllDataTable('uploaded_files', { id: fileId });
            
            if (!fileResponse.success || !fileResponse.data || fileResponse.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            }
            
            const fileRecord = fileResponse.data[0];
            
            // Check if user has permission to download this file
            if (!securityService.canAccessRecord(user, fileRecord)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            
            // Check if file exists on disk
            if (!fs.existsSync(fileRecord.file_path)) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found on disk'
                });
            }
            
            // Set appropriate headers
            res.setHeader('Content-Type', fileRecord.mime_type);
            res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.original_name}"`);
            res.setHeader('Content-Length', fileRecord.file_size);
            
            // Stream the file
            const fileStream = fs.createReadStream(fileRecord.file_path);
            fileStream.pipe(res);
            
        } catch (error) {
            console.error('Error in downloadFile:', error.message);
            res.status(500).json({
                success: false,
                message: 'Download failed'
            });
        }
    },
    
    /**
     * Delete file
     */
    deleteFile: async (req, res) => {
        const resultData = {
            success: false,
            message: ''
        };
        
        try {
            const fileId = req.params.fileId;
            const user = req.user;
            
            // Get file record from database
            const fileResponse = await commonService.getAllDataTable('uploaded_files', { id: fileId });
            
            if (!fileResponse.success || !fileResponse.data || fileResponse.data.length === 0) {
                resultData.message = 'File not found';
                return res.json(resultData);
            }
            
            const fileRecord = fileResponse.data[0];
            
            // Check if user has permission to delete this file
            if (!securityService.canAccessRecord(user, fileRecord)) {
                resultData.message = 'Access denied';
                return res.json(resultData);
            }
            
            // Delete file from disk
            if (fs.existsSync(fileRecord.file_path)) {
                fs.unlinkSync(fileRecord.file_path);
            }
            
            // Delete thumbnail if exists
            if (fileRecord.thumbnail_path && fs.existsSync(fileRecord.thumbnail_path)) {
                fs.unlinkSync(fileRecord.thumbnail_path);
            }
            
            // Delete record from database
            const deleteResult = await commonService.deleteRecordTable('uploaded_files', { id: fileId });
            
            if (deleteResult.success) {
                resultData.success = true;
                resultData.message = 'File deleted successfully';
            } else {
                resultData.message = 'Failed to delete file record';
            }
            
            res.json(resultData);
        } catch (error) {
            console.error('Error in deleteFile:', error.message);
            resultData.message = 'Delete failed';
            res.json(resultData);
        }
    },
    
    /**
     * Get file info
     */
    getFileInfo: async (req, res) => {
        try {
            const fileId = req.params.fileId;
            const user = req.user;
            
            // Get file record from database
            const fileResponse = await commonService.getAllDataTable('uploaded_files', { id: fileId });
            
            if (!fileResponse.success || !fileResponse.data || fileResponse.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            }
            
            const fileRecord = fileResponse.data[0];
            
            // Check if user has permission to view this file
            if (!securityService.canAccessRecord(user, fileRecord)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            
            // Return file info
            res.json({
                success: true,
                data: {
                    id: fileRecord.id,
                    originalName: fileRecord.original_name,
                    filename: fileRecord.filename,
                    mimeType: fileRecord.mime_type,
                    size: fileRecord.file_size,
                    hash: fileRecord.file_hash,
                    thumbnailUrl: fileRecord.thumbnail_path ? `/uploads/thumbnails/${path.basename(fileRecord.thumbnail_path)}` : null,
                    downloadUrl: `/api/files/${fileRecord.id}/download`,
                    createdAt: fileRecord.created_at,
                    uploadedBy: fileRecord.uploaded_by
                }
            });
            
        } catch (error) {
            console.error('Error in getFileInfo:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get file info'
            });
        }
    }
};

module.exports = fileUploadController;
