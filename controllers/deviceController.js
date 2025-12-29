const jwtService = require('../services/jwtService');
const multiDeviceService = require('../services/multiDeviceService');
const commonService = require('../services/commonService');

const deviceController = {
    /**
     * Lấy danh sách thiết bị đang đăng nhập
     */
    getActiveDevices: async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Bạn cần đăng nhập để thực hiện chức năng này'
                });
            }

            const devices = await jwtService.getActiveDevices(req.user.id);
            const settings = await multiDeviceService.getUserSessionSettings(req.user.id);

            // Thêm thông tin bổ sung cho mỗi thiết bị
            const enhancedDevices = devices.map(device => ({
                ...device,
                canLogout: !device.isCurrentSession, // Chỉ có thể logout thiết bị khác
                timeAgo: getTimeAgo(device.lastActivity),
                isExpired: isSessionExpired(device.lastActivity, settings?.session_timeout_hours || 24)
            }));

            res.json({
                success: true,
                data: {
                    devices: enhancedDevices,
                    settings: settings,
                    stats: {
                        total: devices.length,
                        current: devices.filter(d => d.isCurrentSession).length,
                        others: devices.filter(d => !d.isCurrentSession).length
                    }
                }
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Lỗi khi lấy danh sách thiết bị', error, 500));
        }
    },

    /**
     * Logout một thiết bị cụ thể
     */
    logoutDevice: async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Bạn cần đăng nhập để thực hiện chức năng này'
                });
            }

            const { tokenId } = req.body;

            if (!tokenId) {
                return res.status(400).json({
                    success: false,
                    message: 'Token ID không được cung cấp'
                });
            }

            // Kiểm tra xem token có thuộc về user này không
            const devices = await jwtService.getActiveDevices(req.user.id);
            const device = devices.find(d => d.tokenId === tokenId);

            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'Thiết bị không tồn tại hoặc không thuộc về bạn'
                });
            }

            // Không cho phép logout thiết bị hiện tại
            if (device.isCurrentSession) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể logout thiết bị hiện tại'
                });
            }

            // Logout thiết bị
            const result = await multiDeviceService.logoutSession(tokenId);

            if (result.success) {
                // Xóa cache user nếu có
                const cacheService = require('../services/cacheService');
                cacheService.invalidateUser(req.user.id);

                // Gửi thông báo Telegram (nếu có)
                commonService.sendMessageTelegram(`User ${req.user.email} đã logout thiết bị: ${device.deviceName} (${device.browser} - ${device.os})`);

                res.json({
                    success: true,
                    message: `Đã logout thiết bị ${device.deviceName} thành công`,
                    device: {
                        name: device.deviceName,
                        browser: device.browser,
                        os: device.os
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Lỗi khi logout thiết bị'
                });
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Lỗi khi logout thiết bị', error, 500));
        }
    },

    /**
     * Logout tất cả thiết bị khác (trừ thiết bị hiện tại)
     */
    logoutAllOtherDevices: async (req, res) => {
        try {
            if (!req.user || !req.user.id || !req.user.tokenId) {
                return res.status(401).json({
                    success: false,
                    message: 'Bạn cần đăng nhập để thực hiện chức năng này'
                });
            }

            // Lấy danh sách thiết bị khác
            const devices = await jwtService.getActiveDevices(req.user.id);
            const otherDevices = devices.filter(d => !d.isCurrentSession);

            if (otherDevices.length === 0) {
                return res.json({
                    success: true,
                    message: 'Không có thiết bị nào khác để logout',
                    count: 0
                });
            }

            // Logout tất cả thiết bị khác
            const result = await multiDeviceService.logoutAllOtherSessions(req.user.id, req.user.tokenId);

            if (result.success) {
                // Xóa cache user nếu có
                const cacheService = require('../services/cacheService');
                cacheService.invalidateUser(req.user.id);

                // Gửi thông báo Telegram (nếu có)
                commonService.sendMessageTelegram(`User ${req.user.email} đã logout ${otherDevices.length} thiết bị khác`);

                res.json({
                    success: true,
                    message: `Đã logout ${otherDevices.length} thiết bị khác thành công`,
                    count: otherDevices.length,
                    devices: otherDevices.map(d => ({
                        name: d.deviceName,
                        browser: d.browser,
                        os: d.os
                    }))
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Lỗi khi logout thiết bị'
                });
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Lỗi khi logout tất cả thiết bị', error, 500));
        }
    },

    /**
     * Cập nhật cài đặt session
     */
    updateSessionSettings: async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Bạn cần đăng nhập để thực hiện chức năng này'
                });
            }

            const { max_sessions, session_timeout_hours, allow_multiple_devices, notify_new_login, auto_logout_inactive } = req.body;

            // Validate input
            if (max_sessions && (max_sessions < 1 || max_sessions > 10)) {
                return res.status(400).json({
                    success: false,
                    message: 'Số session tối đa phải từ 1 đến 10'
                });
            }

            if (session_timeout_hours && (session_timeout_hours < 1 || session_timeout_hours > 168)) {
                return res.status(400).json({
                    success: false,
                    message: 'Thời gian timeout phải từ 1 đến 168 giờ'
                });
            }

            const settings = {};
            if (max_sessions !== undefined) settings.max_sessions = max_sessions;
            if (session_timeout_hours !== undefined) settings.session_timeout_hours = session_timeout_hours;
            if (allow_multiple_devices !== undefined) settings.allow_multiple_devices = allow_multiple_devices;
            if (notify_new_login !== undefined) settings.notify_new_login = notify_new_login;
            if (auto_logout_inactive !== undefined) settings.auto_logout_inactive = auto_logout_inactive;

            if (Object.keys(settings).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Không có cài đặt nào được cung cấp'
                });
            }

            const result = await multiDeviceService.updateSessionSettings(req.user.id, settings);

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Cập nhật cài đặt thành công',
                    settings: settings
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Lỗi khi cập nhật cài đặt'
                });
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Lỗi khi cập nhật cài đặt', error, 500));
        }
    },

    /**
     * Lấy cài đặt session
     */
    getSessionSettings: async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Bạn cần đăng nhập để thực hiện chức năng này'
                });
            }

            const settings = await multiDeviceService.getUserSessionSettings(req.user.id);

            if (settings) {
                res.json({
                    success: true,
                    data: settings
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy cài đặt session'
                });
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Lỗi khi lấy cài đặt session', error, 500));
        }
    }
};

// Helper functions
function getTimeAgo(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Vừa xong';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' phút trước';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' giờ trước';
        return Math.floor(diff / 86400000) + ' ngày trước';
    } catch (error) {
        commonService.saveLog(req, error.message, error.stack);
        return ''
    }
}

function isSessionExpired(lastActivity, timeoutHours = 24) {
    try {
        const lastActivityDate = new Date(lastActivity);
        const now = new Date();
        const hoursDiff = (now - lastActivityDate) / (1000 * 60 * 60);
        return hoursDiff > timeoutHours;
    } catch (error) {
        commonService.saveLog(req, error.message, error.stack);
        return false
    }
}

module.exports = deviceController; 