const commonService = require('./commonService');
const jwtService = require('./jwtService');

const multiDeviceService = {
    /**
     * Detect thông tin thiết bị từ User-Agent
     * @param {string} userAgent - User-Agent string
     * @returns {Object} - Thông tin thiết bị
     */
    detectDeviceInfo: (userAgent) => {
        let deviceType = 'unknown';
        let deviceName = 'Unknown Device';
        let browser = 'Unknown Browser';
        let os = 'Unknown OS';
        
        // Detect device type
        if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
            deviceType = 'mobile';
        } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
            deviceType = 'tablet';
        } else {
            deviceType = 'desktop';
        }
        
        // Detect browser
        if (userAgent.includes('Chrome')) {
            browser = 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
        } else if (userAgent.includes('Safari')) {
            browser = 'Safari';
        } else if (userAgent.includes('Edge')) {
            browser = 'Edge';
        }
        
        // Detect OS
        if (userAgent.includes('Windows')) {
            os = 'Windows';
        } else if (userAgent.includes('Mac OS')) {
            os = 'macOS';
        } else if (userAgent.includes('Linux')) {
            os = 'Linux';
        } else if (userAgent.includes('Android')) {
            os = 'Android';
        } else if (userAgent.includes('iOS')) {
            os = 'iOS';
        }
        
        // Generate device name
        if (deviceType === 'mobile') {
            if (userAgent.includes('iPhone')) {
                deviceName = 'iPhone';
            } else if (userAgent.includes('Android')) {
                deviceName = 'Android Phone';
            } else {
                deviceName = 'Mobile Device';
            }
        } else if (deviceType === 'tablet') {
            if (userAgent.includes('iPad')) {
                deviceName = 'iPad';
            } else {
                deviceName = 'Tablet';
            }
        } else {
            deviceName = `${os} Computer`;
        }
        
        return {
            deviceName,
            deviceType,
            browser,
            os,
            userAgent: userAgent
        };
    },

    /**
     * Tạo session mới cho user
     * @param {number} userId - ID của user
     * @param {string} tokenId - JWT token ID
     * @param {Object} deviceInfo - Thông tin thiết bị
     * @param {string} ipAddress - IP address
     * @returns {Promise<Object>} - Kết quả tạo session
     */
    createSession: async (userId, tokenId, deviceInfo, ipAddress) => {
        try {
            // Lấy cài đặt session của user
            const userSettings = await multiDeviceService.getUserSessionSettings(userId);
            const allowMultipleDevices = userSettings ? userSettings.allow_multiple_devices : 1;
            const maxSessions = userSettings ? userSettings.max_sessions : 5;

            // Kiểm tra số lượng session hiện tại
            const currentSessions = await multiDeviceService.getActiveSessions(userId);
            
            if (allowMultipleDevices) {
                // Chế độ multi-device: kiểm tra giới hạn số session
                if (currentSessions.length >= maxSessions) {
                    // Xóa session cũ nhất nếu vượt quá giới hạn
                    const oldestSession = currentSessions.sort((a, b) => 
                        new Date(a.login_at) - new Date(b.login_at)
                    )[0];
                    
                    await multiDeviceService.logoutSession(oldestSession.jwt_token_id);
                }
            } else {
                // Chế độ single device: logout tất cả session cũ
                for (const session of currentSessions) {
                    await multiDeviceService.logoutSession(session.jwt_token_id);
                }
            }
            
            // Detect thông tin thiết bị
            const detectedInfo = multiDeviceService.detectDeviceInfo(deviceInfo.userAgent);
            
            // Tạo session mới
            const sessionData = {
                user_id: userId,
                jwt_token_id: tokenId,
                device_name: detectedInfo.deviceName,
                device_type: detectedInfo.deviceType,
                browser: detectedInfo.browser,
                os: detectedInfo.os,
                device_info: JSON.stringify(deviceInfo),
                ip_address: ipAddress,
                user_agent: deviceInfo.userAgent,
                is_current_session: 1
            };
            
            const result = await commonService.addRecordTable(sessionData, 'user_sessions');
            
            if (result.success) {
                // Cập nhật session hiện tại thành 0 cho tất cả session khác của user này
                await commonService.updateRecordTable(
                    { is_current_session: 0 },
                    { user_id: userId, id: { op: '!=', value: result.data.insertId } },
                    'user_sessions'
                );
                
                return { success: true, sessionId: result.data.insertId };
            }
            
            return { success: false, message: 'Không thể tạo session' };
        } catch (error) {
            console.error('Error creating session:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Lấy danh sách session đang hoạt động của user
     * @param {number} userId - ID của user
     * @returns {Promise<Array>} - Danh sách session
     */
    getActiveSessions: async (userId) => {
        try {
            const result = await commonService.getAllDataTable(
                'user_sessions',
                { user_id: userId, is_active: 1 },
                { column: 'last_activity', type: 'desc' }
            );
            
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error getting active sessions:', error);
            return [];
        }
    },

    /**
     * Lấy cài đặt session của user
     * @param {number} userId - ID của user
     * @returns {Promise<Object>} - Cài đặt session
     */
    getUserSessionSettings: async (userId) => {
        try {
            const result = await commonService.getAllDataTable('user_session_settings', { user_id: userId });
            
            if (result.success && result.data && result.data.length > 0) {
                return result.data[0];
            }
            
            // Tạo cài đặt mặc định nếu chưa có
            const defaultSettings = {
                user_id: userId,
                max_sessions: 5,
                session_timeout_hours: 24,
                allow_multiple_devices: 1,
                notify_new_login: 1,
                auto_logout_inactive: 1
            };
            
            const createResult = await commonService.addRecordTable(defaultSettings, 'user_session_settings');
            return createResult.success ? defaultSettings : null;
        } catch (error) {
            console.error('Error getting user session settings:', error);
            return null;
        }
    },

    /**
     * Logout một session cụ thể
     * @param {string} tokenId - JWT token ID
     * @returns {Promise<Object>} - Kết quả logout
     */
    logoutSession: async (tokenId) => {
        try {
            const result = await commonService.updateRecordTable(
                { 
                    logout_at: new Date(),
                    is_active: 0,
                    is_current_session: 0
                },
                { jwt_token_id: tokenId },
                'user_sessions'
            );
            
            return { success: result.success };
        } catch (error) {
            console.error('Error logging out session:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Logout tất cả session của user (trừ session hiện tại)
     * @param {number} userId - ID của user
     * @param {string} currentTokenId - Token ID hiện tại
     * @returns {Promise<Object>} - Kết quả logout
     */
    logoutAllOtherSessions: async (userId, currentTokenId) => {
        try {
            const result = await commonService.updateRecordTable(
                { 
                    logout_at: new Date(),
                    is_active: 0,
                    is_current_session: 0
                },
                { 
                    user_id: userId,
                    jwt_token_id: { op: '!=', value: currentTokenId }
                },
                'user_sessions'
            );
            
            return { success: result.success };
        } catch (error) {
            console.error('Error logging out all other sessions:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Cập nhật thời gian hoạt động cuối cùng
     * @param {string} tokenId - JWT token ID
     * @returns {Promise<Object>} - Kết quả cập nhật
     */
    updateLastActivity: async (tokenId) => {
        try {
            const result = await commonService.updateRecordTable(
                { last_activity: new Date() },
                { jwt_token_id: tokenId },
                'user_sessions'
            );
            
            return { success: result.success };
        } catch (error) {
            console.error('Error updating last activity:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Xóa session hết hạn
     * @returns {Promise<Object>} - Kết quả xóa
     */
    cleanupExpiredSessions: async () => {
        try {
            const timeoutHours = 24; // Có thể lấy từ cài đặt
            const expiredTime = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);
            
            const result = await commonService.updateRecordTable(
                { 
                    logout_at: new Date(),
                    is_active: 0,
                    is_current_session: 0
                },
                { 
                    last_activity: { op: '<', value: expiredTime },
                    is_active: 1
                },
                'user_sessions'
            );
            
            return { success: result.success };
        } catch (error) {
            console.error('Error cleaning up expired sessions:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Cập nhật cài đặt session của user
     * @param {number} userId - ID của user
     * @param {Object} settings - Cài đặt mới
     * @returns {Promise<Object>} - Kết quả cập nhật
     */
    updateSessionSettings: async (userId, settings) => {
        try {
            const result = await commonService.updateRecordTable(
                settings,
                { user_id: userId },
                'user_session_settings'
            );
            
            return { success: result.success };
        } catch (error) {
            console.error('Error updating session settings:', error);
            return { success: false, message: error.message };
        }
    }
};

module.exports = multiDeviceService; 