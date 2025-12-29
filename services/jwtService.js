const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const commonService = require('./commonService');
const multiDeviceService = require('./multiDeviceService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = '24h';

const jwtService = {
    /**
     * Tạo JWT token với token ID duy nhất
     * @param {Object} user - Thông tin user
     * @returns {Object} - Token và tokenId
     */
    createToken: (user) => {
        const tokenId = crypto.randomBytes(32).toString('hex');
        
        const token = jwt.sign(
            { 
                id: user.id,
                email: user.email,
                tokenId: tokenId
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        return { token, tokenId };
    },

    /**
     * Xác thực JWT token
     * @param {string} token - JWT token
     * @returns {Object} - Decoded token hoặc null nếu không hợp lệ
     */
    verifyToken: (token) => {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    },

    /**
     * Lưu token vào database cho multiple device login
     * @param {number} userId - ID của user
     * @param {string} tokenId - Token ID
     * @param {Object} deviceInfo - Thông tin thiết bị
     * @param {string} ipAddress - IP address
     * @returns {Promise<Object>} - Kết quả lưu token
     */
    saveTokenToDatabase: async (userId, tokenId, deviceInfo, ipAddress) => {
        try {
            // Lấy cài đặt session của user
            const userSettings = await multiDeviceService.getUserSessionSettings(userId);
            const allowMultipleDevices = userSettings ? userSettings.allow_multiple_devices : 1;

            if (allowMultipleDevices) {
                // Chế độ multi-device: chỉ tạo session mới, không ghi đè token cũ
                const sessionResult = await multiDeviceService.createSession(userId, tokenId, deviceInfo, ipAddress);
                
                if (!sessionResult.success) {
                    return { success: false, message: sessionResult.message };
                }

                // Chỉ cập nhật thông tin cơ bản trong bảng user (không ghi đè jwt_token_id)
                const updateResult = await commonService.updateRecordTable(
                    { 
                        last_login: new Date()
                    },
                    { id: userId },
                    'user'
                );

                if (!updateResult.success) {
                    return { success: false, message: 'Không thể cập nhật thông tin user' };
                }

                return { success: true, sessionId: sessionResult.sessionId };
            } else {
                // Chế độ single device: xóa session cũ và ghi đè token
                const sessionResult = await multiDeviceService.createSession(userId, tokenId, deviceInfo, ipAddress);
                
                if (!sessionResult.success) {
                    return { success: false, message: sessionResult.message };
                }

                // Cập nhật thông tin cơ bản trong bảng user (bao gồm jwt_token_id cho backward compatibility)
                const updateResult = await commonService.updateRecordTable(
                    { 
                        jwt_token_id: tokenId,
                        device_info: JSON.stringify(deviceInfo),
                        token_created_at: new Date(),
                        last_login: new Date()
                    },
                    { id: userId },
                    'user'
                );

                if (!updateResult.success) {
                    return { success: false, message: 'Không thể cập nhật thông tin user' };
                }

                return { success: true, sessionId: sessionResult.sessionId };
            }
        } catch (error) {
            console.error('Error saving token to database:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Xóa token khỏi database
     * @param {number} userId - ID của user
     * @param {string} tokenId - Token ID
     * @returns {Promise<Object>} - Kết quả xóa token
     */
    removeTokenFromDatabase: async (userId, tokenId) => {
        try {
            // Logout session trong bảng user_sessions
            const sessionResult = await multiDeviceService.logoutSession(tokenId);
            
            // Cập nhật thông tin cơ bản trong bảng user (để backward compatibility)
            const updateResult = await commonService.updateRecordTable(
                { 
                    jwt_token_id: null,
                    device_info: null,
                    token_created_at: null
                },
                { id: userId },
                'user'
            );

            return { success: sessionResult.success && updateResult.success };
        } catch (error) {
            console.error('Error removing token from database:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Kiểm tra token có hợp lệ trong database không
     * @param {number} userId - ID của user
     * @param {string} tokenId - Token ID
     * @returns {Promise<Object>} - Kết quả kiểm tra
     */
    validateTokenInDatabase: async (userId, tokenId) => {
        try {
            // Kiểm tra trong bảng user_sessions
            const sessionResult = await commonService.getAllDataTable('user_sessions', { 
                user_id: userId,
                jwt_token_id: tokenId,
                is_active: 1
            });
            
            if (!sessionResult.success || !sessionResult.data || sessionResult.data.length === 0) {
                return { valid: false, message: 'Token không tồn tại trong database' };
            }
            
            const session = sessionResult.data[0];
            
            // Kiểm tra session có hết hạn không
            const sessionSettings = await multiDeviceService.getUserSessionSettings(userId);
            const timeoutHours = sessionSettings ? sessionSettings.session_timeout_hours : 24;
            const lastActivity = new Date(session.last_activity);
            const now = new Date();
            const hoursDiff = (now - lastActivity) / (1000 * 60 * 60);
            
            if (hoursDiff > timeoutHours) {
                // Session đã hết hạn, logout
                await multiDeviceService.logoutSession(tokenId);
                return { valid: false, message: 'Session đã hết hạn' };
            }
            
            // Cập nhật thời gian hoạt động cuối cùng
            await multiDeviceService.updateLastActivity(tokenId);
            
            // Lấy thông tin user từ bảng user
            const userResult = await commonService.getAllDataTable('user', { id: userId });
            
            if (!userResult.success || !userResult.data || userResult.data.length === 0) {
                return { valid: false, message: 'Tài khoản không tồn tại' };
            }
            
            const user = userResult.data[0];
            
            if (user.active !== 1) {
                return { valid: false, message: 'Tài khoản chưa được kích hoạt' };
            }
            
            return { valid: true, user, session };
        } catch (error) {
            console.error('Error validating token in database:', error);
            return { valid: false, message: error.message };
        }
    },

    /**
     * Lấy thông tin thiết bị từ request
     * @param {Object} req - Express request object
     * @returns {Object} - Thông tin thiết bị
     */
    getDeviceInfo: (req) => {
        return {
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip || req.connection.remoteAddress,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * Làm mới token nếu sắp hết hạn
     * @param {Object} decoded - Decoded JWT token
     * @returns {Object|null} - Token mới hoặc null
     */
    refreshTokenIfNeeded: (decoded) => {
        const now = Date.now() / 1000;
        if (decoded.exp - now < 3600) { // Còn 1 tiếng
            return jwt.sign(
                { 
                    id: decoded.id, 
                    email: decoded.email,
                    tokenId: decoded.tokenId
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );
        }
        return null;
    },

    /**
     * Lấy danh sách thiết bị đang đăng nhập
     * @param {number} userId - ID của user
     * @returns {Promise<Array>} - Danh sách thiết bị
     */
    getActiveDevices: async (userId) => {
        try {
            const sessions = await multiDeviceService.getActiveSessions(userId);
            return sessions.map(session => ({
                id: session.id,
                tokenId: session.jwt_token_id,
                deviceName: session.device_name,
                deviceType: session.device_type,
                browser: session.browser,
                os: session.os,
                ipAddress: session.ip_address,
                loginAt: session.login_at,
                lastActivity: session.last_activity,
                isCurrentSession: session.is_current_session === 1
            }));
        } catch (error) {
            console.error('Error getting active devices:', error);
            return [];
        }
    }
};

module.exports = jwtService; 