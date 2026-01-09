const bcrypt = require('bcrypt');
const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const auditService = require("../services/auditService");
const jwtService = require("../services/jwtService");
// Load dotenv for local development, but use process.env for production (Vercel)
require('dotenv').config({ quiet: true });

// Helper function to get environment variable (works on both local and Vercel)
const getEnv = (key) => process.env[key];

let user = {
    getLogin: function (req, res, next) {
        let reCAPTCHA_site_key = getEnv('SITEKEYRECAPTCHA');
        console.log("SITEKEYRECAPTCHA:", reCAPTCHA_site_key);
        res.render('login', { reCAPTCHA_site_key: reCAPTCHA_site_key });
    },
    getSignUp: function (req, res, next) {
        let reCAPTCHA_site_key = getEnv('SITEKEYRECAPTCHA');
        res.render('sign-up', { reCAPTCHA_site_key: reCAPTCHA_site_key })
    },
    signUp: async function (req, res, next) {
        try {
            let resultData = securityService.createErrorResponse("Đăng ký thất bại");

            // Validate input using security service
            const validationSchema = {
                fullname: {
                    required: true,
                    type: 'string',
                    minLength: 2,
                    maxLength: 100,
                    message: 'Vui lòng nhập họ tên hợp lệ'
                },
                email: {
                    required: true,
                    type: 'email',
                    message: 'Vui lòng nhập email hợp lệ'
                },
                password: {
                    required: true,
                    type: 'string',
                    minLength: 8,
                    maxLength: 100,
                    message: 'Mật khẩu phải có ít nhất 8 ký tự'
                }
            };

            const validation = securityService.validateInput(req.body, validationSchema);
            if (!validation.isValid) {
                resultData.message = validation.errors.map(e => e.message).join(', ');
                return res.json(resultData);
            }

            const param = validation.data;

            if (getEnv('ENABLE_CAPTCHA') == 1) {
                const token = req.body.token;
                // Check if token exists
                if (!token) {
                    resultData.message = "Đăng ký không thành công! Thiếu mã xác thực";
                    return res.json(resultData);
                }

                const dataRecaptcha = {
                    secret: getEnv('SECRETKEYRECAPTCHA'),
                    response: token,
                    remoteip: req.ip // Optional: Add user's IP for additional security
                };

                const captchaResponse = await commonService.postApiCommon(dataRecaptcha, 'https://www.google.com/recaptcha/api/siteverify', { "Content-Type": "application/x-www-form-urlencoded" });

                // Check if reCAPTCHA verification failed
                if (!captchaResponse || !captchaResponse.success) {
                    resultData.message = "Đăng ký không thành công! Xác thực không hợp lệ";
                    return res.json(resultData);
                }
                commonService.sendMessageTelegram(`captchaResponse ${JSON.stringify(captchaResponse.data)}`);
                // Check score for v3 reCAPTCHA
                if (captchaResponse.data && captchaResponse.data.success && captchaResponse.data.score && captchaResponse.data.score <= 0.5) {
                    resultData.message = "Đăng nhập không thành công! Hoạt động đáng ngờ được phát hiện";
                    return res.json(resultData);
                }
            }
            if (!param.email || !param.password) {
                resultData.message = !param.email ? 'Vui lòng nhập Email' : 'Vui lòng nhập mật khẩu';
                return res.json(resultData);
            }
            // Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(param.password, 10);
            param.password = hashedPassword;
            // Kiểm tra user đã tồn tại chưa
            commonService.getAllDataTable('user', { email: param.email }).then(responseData1 => {
                if (responseData1.success && responseData1.data && responseData1.data.length > 0) {
                    // Nếu đã tồn tại
                    commonService.sendMessageTelegram('Tài khoản ' + param.email + ' đã được đăng ký! Tạo tài khoản thất bại');
                    resultData.message = 'Email ' + param.email + ' đã được đăng ký! Vui lòng chọn email khác';
                    res.json(resultData);
                } else {
                    commonService.addRecordTable(param, 'user', true).then(responseData => {
                        if (responseData.success && responseData.data.insertId) {
                            resultData.success = true;
                            resultData.message = 'Thành công';
                            commonService.addRecordTable({ role_id: 2, user_id: responseData.data.insertId }, 'role_user');
                            commonService.sendMessageTelegram('Tài khoản ' + param.email + ' được tạo thành công!');
                        } else {
                            resultData.message = responseData.message;
                        }
                        res.json(resultData);
                    })
                }
            })
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
        }
    },
    /**
     * Handles user login with reCAPTCHA verification and JWT token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {Object} JSON response with login result
     */
    login: async function (req, res, next) {
        let resultData = securityService.createErrorResponse("Đăng nhập thất bại");

        try {
            // Validate input
            const validationSchema = {
                email: {
                    required: true,
                    type: 'email',
                    message: 'Email không hợp lệ'
                },
                password: {
                    required: true,
                    type: 'string',
                    minLength: 1,
                    message: 'Vui lòng nhập mật khẩu'
                }
            };

            const validation = securityService.validateInput(req.body, validationSchema);
            if (!validation.isValid) {
                resultData.message = validation.errors.map(e => e.message).join(', ');
                return res.json(resultData);
            }
            // Step 1: Verify reCAPTCHA if enabled
            if (getEnv('ENABLE_CAPTCHA') == 1) {
                const token = req.body.token;

                // Check if token exists
                if (!token) {
                    resultData.message = "Đăng nhập không thành công! Thiếu mã xác thực";
                    return res.json(resultData);
                }

                const dataRecaptcha = {
                    secret: getEnv('SECRETKEYRECAPTCHA'),
                    response: token,
                    remoteip: req.ip // Optional: Add user's IP for additional security
                };

                const captchaResponse = await commonService.postApiCommon(dataRecaptcha, 'https://www.google.com/recaptcha/api/siteverify', { "Content-Type": "application/x-www-form-urlencoded" });

                // Check if reCAPTCHA verification failed
                if (!captchaResponse || !captchaResponse.success) {
                    resultData.message = "Đăng nhập không thành công! Xác thực không hợp lệ";
                    return res.json(resultData);
                }
                commonService.sendMessageTelegram(`captchaResponse ${JSON.stringify(captchaResponse.data)}`);
                // Check score for v3 reCAPTCHA
                if (captchaResponse.data && captchaResponse.data.success && captchaResponse.data.score && captchaResponse.data.score <= 0.5) {
                    resultData.message = "Đăng nhập không thành công! Hoạt động đáng ngờ được phát hiện";
                    return res.json(resultData);
                }
            }

            // Step 2: Authenticate user manually (thay vì dùng passport)
            const { email, password } = validation.data;

            try {
                // Tìm user trong database
                const userResult = await commonService.getAllDataTable('user', { email: email });

                if (!userResult.success || !userResult.data || userResult.data.length === 0) {
                    resultData.message = 'Tài khoản không tồn tại';
                    await auditService.logAuthEvent(email, 'LOGIN', false, { reason: 'user_not_found' }, req.ip);
                    commonService.sendMessageTelegram(`Tài khoản ${email} vừa đăng nhập thất bại! Tài khoản không tồn tại`);
                    return res.json(resultData);
                }

                const user = userResult.data[0];

                // Kiểm tra mật khẩu
                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    resultData.message = 'Sai mật khẩu';
                    commonService.sendMessageTelegram(`Tài khoản ${email} vừa đăng nhập thất bại! Sai mật khẩu`);
                    return res.json(resultData);
                }

                // Kiểm tra tài khoản có active không
                if (user.active !== 1) {
                    resultData.message = 'Tài khoản chưa được kích hoạt';
                    commonService.sendMessageTelegram(`Tài khoản ${email} vừa đăng nhập thất bại! Tài khoản chưa kích hoạt`);
                    return res.json(resultData);
                }

                // Tạo JWT token với token ID duy nhất
                const { token: jwtToken, tokenId } = jwtService.createToken(user);

                // Lấy thông tin thiết bị
                const deviceInfo = jwtService.getDeviceInfo(req);

                // Lưu token vào database với multi-device support
                const saveResult = await jwtService.saveTokenToDatabase(user.id, tokenId, deviceInfo, req.ip);

                if (!saveResult.success) {
                    resultData.message = saveResult.message;
                    return res.status(500).json(resultData);
                }

                // Set JWT cookie
                req.app.locals.setJWTCookie(res, jwtToken);

                resultData = securityService.createSuccessResponse(null, 'Đăng nhập thành công');

                // Log successful login
                await auditService.logAuthEvent(email, 'LOGIN', true, {
                    userId: user.id,
                    deviceInfo: deviceInfo.deviceName
                }, req.ip);

                commonService.sendMessageTelegram(`Tài khoản ${email} vừa đăng nhập thành công!`);
                return res.json(resultData);

            } catch (authError) {
                console.error('Authentication error:', authError);
                resultData.message = 'Lỗi xác thực, vui lòng thử lại sau';
                return res.status(500).json(resultData);
            }

        } catch (globalError) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
        }
    },
    logout: async function (req, res, next) {
        try {
            if (req.user && req.user.tokenId) {
                try {
                    // Xóa token khỏi database
                    await jwtService.removeTokenFromDatabase(req.user.id, req.user.tokenId);

                    // Xóa cache user nếu có
                    const cacheService = require('../services/cacheService');
                    cacheService.invalidateUser(req.user.id);

                } catch (error) {
                    console.error('Logout error:', error);
                }
            }

            // Xóa JWT cookie
            req.app.locals.clearJWTCookie(res);

            res.redirect('/login');
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.redirect('/login');
        }
    }
}

module.exports = user;
