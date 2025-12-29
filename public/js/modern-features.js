/**
 * Modern Features for Survey System
 */
class ModernFeatures {
    constructor() {
        this.qrGenerator = null;
        this.socialSharing = null;
        this.offlineManager = null;
        this.init();
    }
    
    init() {
        this.initQRCodeGenerator();
        this.initSocialSharing();
        this.initOfflineCapability();
        this.initPWAFeatures();
    }
    
    /**
     * QR Code Generation
     */
    initQRCodeGenerator() {
        this.qrGenerator = {
            generate: (text, options = {}) => {
                const defaultOptions = {
                    width: 256,
                    height: 256,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                };
                
                const qrOptions = { ...defaultOptions, ...options };
                
                return new Promise((resolve, reject) => {
                    if (typeof QRCode !== 'undefined') {
                        QRCode.toDataURL(text, qrOptions, (err, url) => {
                            if (err) reject(err);
                            else resolve(url);
                        });
                    } else {
                        // Fallback to API generation
                        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrOptions.width}x${qrOptions.height}&data=${encodeURIComponent(text)}`;
                        resolve(apiUrl);
                    }
                });
            },
            
            generateForSurvey: async (surveyUrl, surveyName) => {
                const qrData = {
                    url: surveyUrl,
                    name: surveyName,
                    timestamp: new Date().toISOString()
                };
                
                return await this.generate(surveyUrl, {
                    width: 300,
                    height: 300
                });
            },
            
            downloadQR: (dataUrl, filename = 'survey-qr-code.png') => {
                const link = document.createElement('a');
                link.download = filename;
                link.href = dataUrl;
                link.click();
            }
        };
    }
    
    /**
     * Social Sharing
     */
    initSocialSharing() {
        this.socialSharing = {
            platforms: {
                facebook: {
                    name: 'Facebook',
                    icon: 'fab fa-facebook-f',
                    color: '#1877f2',
                    shareUrl: 'https://www.facebook.com/sharer/sharer.php?u={url}&quote={text}'
                },
                twitter: {
                    name: 'Twitter',
                    icon: 'fab fa-twitter',
                    color: '#1da1f2',
                    shareUrl: 'https://twitter.com/intent/tweet?url={url}&text={text}&hashtags={hashtags}'
                },
                linkedin: {
                    name: 'LinkedIn',
                    icon: 'fab fa-linkedin-in',
                    color: '#0077b5',
                    shareUrl: 'https://www.linkedin.com/sharing/share-offsite/?url={url}'
                },
                whatsapp: {
                    name: 'WhatsApp',
                    icon: 'fab fa-whatsapp',
                    color: '#25d366',
                    shareUrl: 'https://wa.me/?text={text}%20{url}'
                },
                telegram: {
                    name: 'Telegram',
                    icon: 'fab fa-telegram-plane',
                    color: '#0088cc',
                    shareUrl: 'https://t.me/share/url?url={url}&text={text}'
                },
                email: {
                    name: 'Email',
                    icon: 'fas fa-envelope',
                    color: '#6c757d',
                    shareUrl: 'mailto:?subject={subject}&body={text}%20{url}'
                }
            },
            
            share: (platform, options) => {
                const platformConfig = this.platforms[platform];
                if (!platformConfig) {
                    console.error('Unsupported platform:', platform);
                    return;
                }
                
                let shareUrl = platformConfig.shareUrl;
                
                // Replace placeholders
                shareUrl = shareUrl.replace('{url}', encodeURIComponent(options.url || ''));
                shareUrl = shareUrl.replace('{text}', encodeURIComponent(options.text || ''));
                shareUrl = shareUrl.replace('{subject}', encodeURIComponent(options.subject || ''));
                shareUrl = shareUrl.replace('{hashtags}', encodeURIComponent(options.hashtags || ''));
                
                // Open share window
                const width = 600;
                const height = 400;
                const left = (screen.width - width) / 2;
                const top = (screen.height - height) / 2;
                
                window.open(
                    shareUrl,
                    'share',
                    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
                );
            },
            
            generateShareButtons: (options) => {
                const { url, text, subject, hashtags, platforms = ['facebook', 'twitter', 'linkedin', 'whatsapp'] } = options;
                
                return platforms.map(platform => {
                    const config = this.platforms[platform];
                    return `
                        <button class="btn btn-outline-secondary social-share-btn" 
                                data-platform="${platform}"
                                data-url="${url}"
                                data-text="${text}"
                                data-subject="${subject || ''}"
                                data-hashtags="${hashtags || ''}"
                                style="border-color: ${config.color}; color: ${config.color};"
                                title="Share on ${config.name}">
                            <i class="${config.icon}"></i>
                            <span class="d-none d-md-inline ms-1">${config.name}</span>
                        </button>
                    `;
                }).join('');
            },
            
            copyToClipboard: async (text) => {
                try {
                    await navigator.clipboard.writeText(text);
                    return true;
                } catch (err) {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    const success = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    return success;
                }
            }
        };
        
        // Bind social share events
        $(document).on('click', '.social-share-btn', (e) => {
            const $btn = $(e.currentTarget);
            const platform = $btn.data('platform');
            const options = {
                url: $btn.data('url'),
                text: $btn.data('text'),
                subject: $btn.data('subject'),
                hashtags: $btn.data('hashtags')
            };
            
            this.socialSharing.share(platform, options);
        });
    }
    
    /**
     * Offline Capability
     */
    initOfflineCapability() {
        this.offlineManager = {
            isOnline: navigator.onLine,
            pendingSubmissions: [],
            
            init: () => {
                // Listen for online/offline events
                window.addEventListener('online', this.handleOnline.bind(this));
                window.addEventListener('offline', this.handleOffline.bind(this));
                
                // Load pending submissions from localStorage
                this.loadPendingSubmissions();
                
                // Update UI based on current status
                this.updateConnectionStatus();
            },
            
            saveOffline: (formData, surveyId) => {
                const submission = {
                    id: this.generateId(),
                    surveyId: surveyId,
                    data: formData,
                    timestamp: new Date().toISOString(),
                    status: 'pending'
                };
                
                this.pendingSubmissions.push(submission);
                this.savePendingSubmissions();
                
                return submission.id;
            },
            
            syncPendingSubmissions: async () => {
                if (!this.isOnline || this.pendingSubmissions.length === 0) {
                    return;
                }
                
                const submissions = [...this.pendingSubmissions];
                
                for (const submission of submissions) {
                    try {
                        const response = await fetch('/api/survey/submit', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                surveyId: submission.surveyId,
                                data: submission.data,
                                offline: true,
                                originalTimestamp: submission.timestamp
                            })
                        });
                        
                        if (response.ok) {
                            // Remove successful submission
                            this.pendingSubmissions = this.pendingSubmissions.filter(s => s.id !== submission.id);
                            console.log('Synced offline submission:', submission.id);
                        }
                    } catch (error) {
                        console.error('Failed to sync submission:', submission.id, error);
                    }
                }
                
                this.savePendingSubmissions();
                this.updateConnectionStatus();
            },
            
            loadPendingSubmissions: () => {
                try {
                    const stored = localStorage.getItem('pendingSubmissions');
                    this.pendingSubmissions = stored ? JSON.parse(stored) : [];
                } catch (error) {
                    console.error('Failed to load pending submissions:', error);
                    this.pendingSubmissions = [];
                }
            },
            
            savePendingSubmissions: () => {
                try {
                    localStorage.setItem('pendingSubmissions', JSON.stringify(this.pendingSubmissions));
                } catch (error) {
                    console.error('Failed to save pending submissions:', error);
                }
            },
            
            updateConnectionStatus: () => {
                const statusElement = document.getElementById('connectionStatus');
                if (statusElement) {
                    if (this.isOnline) {
                        statusElement.innerHTML = `
                            <span class="badge bg-success">
                                <i class="fas fa-wifi"></i> Online
                                ${this.pendingSubmissions.length > 0 ? `(${this.pendingSubmissions.length} pending)` : ''}
                            </span>
                        `;
                    } else {
                        statusElement.innerHTML = `
                            <span class="badge bg-warning">
                                <i class="fas fa-wifi-slash"></i> Offline
                            </span>
                        `;
                    }
                }
            }
        };
        
        this.offlineManager.init();
    }
    
    handleOnline() {
        this.offlineManager.isOnline = true;
        this.offlineManager.updateConnectionStatus();
        this.offlineManager.syncPendingSubmissions();
        
        // Show notification
        this.showNotification('Connection restored. Syncing data...', 'success');
    }
    
    handleOffline() {
        this.offlineManager.isOnline = false;
        this.offlineManager.updateConnectionStatus();
        
        // Show notification
        this.showNotification('You are now offline. Responses will be saved locally.', 'warning');
    }
    
    /**
     * PWA Features
     */
    initPWAFeatures() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
        
        // Handle install prompt
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            const installBtn = document.getElementById('installBtn');
            if (installBtn) {
                installBtn.style.display = 'block';
                installBtn.addEventListener('click', () => {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted the install prompt');
                        }
                        deferredPrompt = null;
                        installBtn.style.display = 'none';
                    });
                });
            }
        });
        
        // Handle app installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.showNotification('App installed successfully!', 'success');
        });
    }
    
    /**
     * Utility methods
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    /**
     * Generate survey sharing package
     */
    generateSharingPackage(survey) {
        const surveyUrl = `${window.location.origin}/survey/${survey.slug}`;
        const shareText = `Please take a moment to complete this survey: ${survey.name}`;
        
        return {
            url: surveyUrl,
            text: shareText,
            subject: `Survey: ${survey.name}`,
            hashtags: 'survey,feedback',
            qrCode: this.qrGenerator.generateForSurvey(surveyUrl, survey.name),
            socialButtons: this.socialSharing.generateShareButtons({
                url: surveyUrl,
                text: shareText,
                subject: `Survey: ${survey.name}`,
                hashtags: 'survey,feedback'
            })
        };
    }
    
    /**
     * Mobile app features
     */
    initMobileFeatures() {
        // Detect mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Add mobile-specific classes
            document.body.classList.add('mobile-device');
            
            // Handle device orientation
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    window.scrollTo(0, 1);
                }, 100);
            });
            
            // Prevent zoom on input focus (iOS)
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    const viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
                    }
                });
                
                input.addEventListener('blur', () => {
                    const viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
                    }
                });
            });
        }
    }
}

// Initialize modern features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.modernFeatures = new ModernFeatures();
});
