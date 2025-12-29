/**
 * Advanced File Upload Component
 */
class FileUpload {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            allowedTypes: ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
            showPreview: true,
            enableDragDrop: true,
            enableCamera: true,
            enableCrop: false,
            uploadUrl: '/api/upload',
            deleteUrl: '/api/delete',
            ...options
        };
        
        this.files = [];
        this.uploadedFiles = [];
        this.dragCounter = 0;
        
        this.init();
    }
    
    init() {
        this.render();
        this.bindEvents();
    }
    
    render() {
        const html = `
            <div class="file-upload-container">
                <div class="file-upload-area ${this.options.enableDragDrop ? 'drag-drop-enabled' : ''}">
                    <div class="upload-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <div class="upload-text">
                        <h6>Drop files here or click to browse</h6>
                        <p class="text-muted">
                            Max ${this.options.maxFiles} files, ${this.formatFileSize(this.options.maxFileSize)} each
                        </p>
                    </div>
                    <input type="file" class="file-input" multiple 
                           accept="${this.options.allowedTypes.join(',')}"
                           style="display: none;">
                    <div class="upload-buttons">
                        <button type="button" class="btn btn-primary btn-browse">
                            <i class="fas fa-folder-open"></i> Browse Files
                        </button>
                        ${this.options.enableCamera ? `
                            <button type="button" class="btn btn-secondary btn-camera">
                                <i class="fas fa-camera"></i> Take Photo
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="file-list" style="display: none;">
                    <h6>Selected Files</h6>
                    <div class="files-container"></div>
                </div>
                
                <div class="upload-progress" style="display: none;">
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                    </div>
                    <div class="progress-text">Uploading...</div>
                </div>
            </div>
            
            <!-- Camera Modal -->
            ${this.options.enableCamera ? this.renderCameraModal() : ''}
            
            <!-- Image Crop Modal -->
            ${this.options.enableCrop ? this.renderCropModal() : ''}
        `;
        
        $(this.container).html(html);
    }
    
    renderCameraModal() {
        return `
            <div class="modal fade" id="cameraModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Take Photo</h5>
                            <button type="button" class="close" data-bs-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="camera-container">
                                <video id="cameraVideo" autoplay playsinline></video>
                                <canvas id="cameraCanvas" style="display: none;"></canvas>
                            </div>
                            <div class="camera-controls">
                                <button type="button" class="btn btn-primary btn-capture">
                                    <i class="fas fa-camera"></i> Capture
                                </button>
                                <button type="button" class="btn btn-secondary btn-retake" style="display: none;">
                                    <i class="fas fa-redo"></i> Retake
                                </button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary btn-use-photo" disabled>
                                <i class="fas fa-check"></i> Use Photo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderCropModal() {
        return `
            <div class="modal fade" id="cropModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Crop Image</h5>
                            <button type="button" class="close" data-bs-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="crop-container">
                                <img id="cropImage" style="max-width: 100%;">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary btn-crop-save">
                                <i class="fas fa-crop"></i> Crop & Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        const $container = $(this.container);
        
        // Browse button
        $container.on('click', '.btn-browse', () => {
            $container.find('.file-input').click();
        });
        
        // File input change
        $container.on('change', '.file-input', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // Drag and drop
        if (this.options.enableDragDrop) {
            const $uploadArea = $container.find('.file-upload-area');
            
            $uploadArea.on('dragenter', (e) => {
                e.preventDefault();
                this.dragCounter++;
                $uploadArea.addClass('drag-over');
            });
            
            $uploadArea.on('dragleave', (e) => {
                e.preventDefault();
                this.dragCounter--;
                if (this.dragCounter === 0) {
                    $uploadArea.removeClass('drag-over');
                }
            });
            
            $uploadArea.on('dragover', (e) => {
                e.preventDefault();
            });
            
            $uploadArea.on('drop', (e) => {
                e.preventDefault();
                this.dragCounter = 0;
                $uploadArea.removeClass('drag-over');
                this.handleFiles(e.originalEvent.dataTransfer.files);
            });
        }
        
        // Camera button
        if (this.options.enableCamera) {
            $container.on('click', '.btn-camera', () => {
                this.openCamera();
            });
            
            // Camera controls
            $container.on('click', '.btn-capture', () => {
                this.capturePhoto();
            });
            
            $container.on('click', '.btn-retake', () => {
                this.retakePhoto();
            });
            
            $container.on('click', '.btn-use-photo', () => {
                this.usePhoto();
            });
        }
        
        // File actions
        $container.on('click', '.btn-remove-file', (e) => {
            const index = $(e.target).data('index');
            this.removeFile(index);
        });
        
        $container.on('click', '.btn-crop-file', (e) => {
            const index = $(e.target).data('index');
            this.cropFile(index);
        });
        
        // Upload button
        $container.on('click', '.btn-upload-all', () => {
            this.uploadAllFiles();
        });
    }
    
    handleFiles(fileList) {
        const files = Array.from(fileList);
        
        // Validate files
        const validFiles = files.filter(file => this.validateFile(file));
        
        // Check total file count
        if (this.files.length + validFiles.length > this.options.maxFiles) {
            this.showError(`Maximum ${this.options.maxFiles} files allowed`);
            return;
        }
        
        // Add files
        validFiles.forEach(file => {
            const fileObj = {
                file: file,
                id: this.generateId(),
                name: file.name,
                size: file.size,
                type: file.type,
                preview: null,
                uploaded: false,
                uploading: false,
                error: null
            };
            
            this.files.push(fileObj);
            
            // Generate preview for images
            if (file.type.startsWith('image/')) {
                this.generatePreview(fileObj);
            }
        });
        
        this.renderFileList();
    }
    
    validateFile(file) {
        // Check file size
        if (file.size > this.options.maxFileSize) {
            this.showError(`File "${file.name}" is too large. Maximum size is ${this.formatFileSize(this.options.maxFileSize)}`);
            return false;
        }
        
        // Check file type
        const isValidType = this.options.allowedTypes.some(type => {
            if (type.startsWith('.')) {
                return file.name.toLowerCase().endsWith(type.toLowerCase());
            } else if (type.includes('*')) {
                const baseType = type.split('/')[0];
                return file.type.startsWith(baseType);
            } else {
                return file.type === type;
            }
        });
        
        if (!isValidType) {
            this.showError(`File type "${file.type}" is not allowed`);
            return false;
        }
        
        return true;
    }
    
    generatePreview(fileObj) {
        const reader = new FileReader();
        reader.onload = (e) => {
            fileObj.preview = e.target.result;
            this.renderFileList();
        };
        reader.readAsDataURL(fileObj.file);
    }
    
    renderFileList() {
        const $container = $(this.container);
        const $fileList = $container.find('.file-list');
        const $filesContainer = $container.find('.files-container');
        
        if (this.files.length === 0) {
            $fileList.hide();
            return;
        }
        
        $fileList.show();
        
        const html = this.files.map((fileObj, index) => `
            <div class="file-item" data-index="${index}">
                <div class="file-preview">
                    ${fileObj.preview ? `
                        <img src="${fileObj.preview}" alt="${fileObj.name}" class="preview-image">
                    ` : `
                        <div class="file-icon">
                            <i class="fas ${this.getFileIcon(fileObj.type)}"></i>
                        </div>
                    `}
                </div>
                <div class="file-info">
                    <div class="file-name">${fileObj.name}</div>
                    <div class="file-size">${this.formatFileSize(fileObj.size)}</div>
                    ${fileObj.error ? `<div class="file-error text-danger">${fileObj.error}</div>` : ''}
                    ${fileObj.uploading ? `
                        <div class="file-progress">
                            <div class="progress">
                                <div class="progress-bar" style="width: ${fileObj.progress || 0}%"></div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="file-actions">
                    ${fileObj.preview && this.options.enableCrop ? `
                        <button type="button" class="btn btn-sm btn-outline-primary btn-crop-file" data-index="${index}">
                            <i class="fas fa-crop"></i>
                        </button>
                    ` : ''}
                    <button type="button" class="btn btn-sm btn-outline-danger btn-remove-file" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        $filesContainer.html(html);
        
        // Show upload button if there are files to upload
        const hasUnuploadedFiles = this.files.some(f => !f.uploaded && !f.uploading);
        if (hasUnuploadedFiles) {
            if (!$container.find('.btn-upload-all').length) {
                $fileList.append(`
                    <div class="upload-actions">
                        <button type="button" class="btn btn-success btn-upload-all">
                            <i class="fas fa-upload"></i> Upload All Files
                        </button>
                    </div>
                `);
            }
        }
    }
    
    removeFile(index) {
        this.files.splice(index, 1);
        this.renderFileList();
    }
    
    async uploadAllFiles() {
        const unuploadedFiles = this.files.filter(f => !f.uploaded && !f.uploading);
        
        for (const fileObj of unuploadedFiles) {
            await this.uploadFile(fileObj);
        }
    }
    
    async uploadFile(fileObj) {
        fileObj.uploading = true;
        fileObj.progress = 0;
        this.renderFileList();
        
        const formData = new FormData();
        formData.append('file', fileObj.file);
        formData.append('survey_id', this.options.surveyId || '');
        
        try {
            const response = await $.ajax({
                url: this.options.uploadUrl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                xhr: () => {
                    const xhr = new XMLHttpRequest();
                    xhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                            fileObj.progress = Math.round((e.loaded / e.total) * 100);
                            this.renderFileList();
                        }
                    });
                    return xhr;
                }
            });
            
            if (response.success) {
                fileObj.uploaded = true;
                fileObj.uploading = false;
                fileObj.uploadedData = response.data;
                this.uploadedFiles.push(fileObj);
            } else {
                throw new Error(response.message || 'Upload failed');
            }
        } catch (error) {
            fileObj.uploading = false;
            fileObj.error = error.message || 'Upload failed';
        }
        
        this.renderFileList();
    }
    
    openCamera() {
        const $modal = $('#cameraModal');
        $modal.modal('show');
        
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                const video = document.getElementById('cameraVideo');
                video.srcObject = stream;
                this.cameraStream = stream;
            })
            .catch(error => {
                console.error('Camera access error:', error);
                this.showError('Unable to access camera');
                $modal.modal('hide');
            });
    }
    
    capturePhoto() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        // Hide video, show canvas
        $(video).hide();
        $(canvas).show();
        
        // Update buttons
        $('.btn-capture').hide();
        $('.btn-retake, .btn-use-photo').show().prop('disabled', false);
    }
    
    retakePhoto() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        
        // Show video, hide canvas
        $(video).show();
        $(canvas).hide();
        
        // Update buttons
        $('.btn-capture').show();
        $('.btn-retake, .btn-use-photo').hide();
    }
    
    usePhoto() {
        const canvas = document.getElementById('cameraCanvas');
        
        canvas.toBlob(blob => {
            const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
            this.handleFiles([file]);
            
            // Close modal and stop camera
            $('#cameraModal').modal('hide');
            this.stopCamera();
        }, 'image/jpeg', 0.8);
    }
    
    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
    }
    
    cropFile(index) {
        const fileObj = this.files[index];
        if (!fileObj.preview) return;
        
        const $modal = $('#cropModal');
        const $img = $('#cropImage');
        
        $img.attr('src', fileObj.preview);
        $modal.modal('show');
        
        // Initialize cropper (requires Cropper.js library)
        if (typeof Cropper !== 'undefined') {
            $img.on('load', () => {
                this.cropper = new Cropper($img[0], {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 0.8
                });
            });
        }
    }
    
    getFileIcon(type) {
        if (type.startsWith('image/')) return 'fa-image';
        if (type.includes('pdf')) return 'fa-file-pdf';
        if (type.includes('word') || type.includes('document')) return 'fa-file-word';
        if (type.includes('excel') || type.includes('spreadsheet')) return 'fa-file-excel';
        if (type.includes('powerpoint') || type.includes('presentation')) return 'fa-file-powerpoint';
        if (type.includes('text')) return 'fa-file-alt';
        if (type.includes('video')) return 'fa-file-video';
        if (type.includes('audio')) return 'fa-file-audio';
        return 'fa-file';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    showError(message) {
        // You can customize this to show errors in your preferred way
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Upload Error',
                text: message
            });
        } else {
            alert(message);
        }
    }
    
    // Public methods
    getUploadedFiles() {
        return this.uploadedFiles;
    }
    
    clearFiles() {
        this.files = [];
        this.uploadedFiles = [];
        this.renderFileList();
    }
    
    setOptions(options) {
        this.options = { ...this.options, ...options };
    }
    
    destroy() {
        this.stopCamera();
        if (this.cropper) {
            this.cropper.destroy();
        }
        $(this.container).empty();
    }
}
