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
        const loginEmail = req.body?.email || 'unknown';
        const clientIp = req.ip;
        const timestamp = new Date().toISOString();
        const usePrisma = process.env.USE_PRISMA === 'true';
        const dbType = process.env.DB_TYPE || 'unknown';

        // Helper function to log both DB and Telegram
        const logError = async (step, message, details = {}) => {
            const fullMessage = `[LOGIN ERROR] ${timestamp}\nEmail: ${loginEmail}\nStep: ${step}\nError: ${message}\nUSE_PRISMA: ${usePrisma}\nDB_TYPE: ${dbType}\nDetails: ${JSON.stringify(details)}`;
            console.error(fullMessage);
            commonService.sendMessageTelegram(fullMessage);
            try {
                await auditService.logLoginStep(loginEmail, step, 'ERROR', false, { error: message, ...details }, clientIp);
            } catch (e) {
                console.error('Failed to log to DB:', e.message);
            }
        };

        const logInfo = async (step, stepName, success, details = {}) => {
            try {
                await auditService.logLoginStep(loginEmail, step, stepName, success, details, clientIp);
            } catch (e) {
                console.error('Failed to log to DB:', e.message);
            }
        };

        // Debug logging for Vercel
        console.log('[LOGIN] ========== LOGIN ATTEMPT START ==========');
        console.log('[LOGIN] Timestamp:', timestamp);
        console.log('[LOGIN] Email:', loginEmail);
        console.log('[LOGIN] Has password:', !!req.body?.password);
        console.log('[LOGIN] Has token:', !!req.body?.token);
        console.log('[LOGIN] ENABLE_CAPTCHA:', getEnv('ENABLE_CAPTCHA'));
        console.log('[LOGIN] NODE_ENV:', process.env.NODE_ENV);
        console.log('[LOGIN] USE_PRISMA:', usePrisma);
        console.log('[LOGIN] DB_TYPE:', dbType);

        try {
            // Step 0: Test database connection first
            console.log('[LOGIN] Step 0: Testing database connection...');
            let dbConnected = false;
            let dbTestMessage = '';
            
            try {
                if (usePrisma) {
                    // Test Prisma connection
                    const prismaService = require('../services/prismaService');
                    dbConnected = await prismaService.testConnection();
                    dbTestMessage = dbConnected ? 'Prisma connection OK' : 'Prisma connection FAILED';
                } else {
                    // Test raw DB connection
                    const db = require('../config/db');
                    const testResult = await new Promise((resolve) => {
                        if (db.getDbType() === 'postgres') {
                            db.get().query('SELECT 1 as test', (err, result) => {
                                if (err) {
                                    resolve({ success: false, message: err.message });
                                } else {
                                    resolve({ success: true, message: 'PostgreSQL connection OK' });
                                }
                            });
                        } else {
                            db.get().getConnection((err, conn) => {
                                if (err) {
                                    resolve({ success: false, message: err.message });
                                } else {
                                    conn.release();
                                    resolve({ success: true, message: 'MySQL connection OK' });
                                }
                            });
                        }
                    });
                    dbConnected = testResult.success;
                    dbTestMessage = testResult.message;
                }
            } catch (dbTestError) {
                dbTestMessage = dbTestError.message;
                dbConnected = false;
            }

            console.log('[LOGIN] DB Connection Test:', dbTestMessage);
            await logInfo(0, 'DB_CONNECTION_TEST', dbConnected, { message: dbTestMessage, usePrisma, dbType });

            if (!dbConnected) {
                await logError(0, 'Database connection failed', { dbTestMessage });
                resultData.message = 'Lỗi kết nối cơ sở dữ liệu';
                return res.status(500).json(resultData);
            }

            // Log login start
            await logInfo(0, 'LOGIN_START', true, {
                hasCaptcha: getEnv('ENABLE_CAPTCHA') == 1,
                hasPassword: !!req.body?.password,
                hasToken: !!req.body?.token,
                usePrisma,
                dbType
            });
            commonService.sendMessageTelegram(`[LOGIN START] ${loginEmail} - DB: ${dbTestMessage}`);

            // Validate input
            console.log('[LOGIN] Step 1: Validating input...');
            const validationSchema = {
                email: { required: true, type: 'email', message: 'Email không hợp lệ' },
                password: { required: true, type: 'string', minLength: 1, message: 'Vui lòng nhập mật khẩu' }
            };

            const validation = securityService.validateInput(req.body, validationSchema);
            if (!validation.isValid) {
                resultData.message = validation.errors.map(e => e.message).join(', ');
                await logError(1, 'Validation failed', { errors: resultData.message });
                return res.json(resultData);
            }
            await logInfo(1, 'VALIDATION_OK', true, {});

            // Step 1: Verify reCAPTCHA if enabled
            if (getEnv('ENABLE_CAPTCHA') == 1) {
                console.log('[LOGIN] Step 1b: Verifying reCAPTCHA...');
                const token = req.body.token;

                if (!token) {
                    resultData.message = "Đăng nhập không thành công! Thiếu mã xác thực";
                    await logError(1, 'Captcha token missing', {});
                    return res.json(resultData);
                }

                try {
                    const dataRecaptcha = {
                        secret: getEnv('SECRETKEYRECAPTCHA'),
                        response: token,
                        remoteip: req.ip
                    };

                    const captchaResponse = await commonService.postApiCommon(dataRecaptcha, 'https://www.google.com/recaptcha/api/siteverify', { "Content-Type": "application/x-www-form-urlencoded" });

                    if (!captchaResponse || !captchaResponse.success) {
                        resultData.message = "Đăng nhập không thành công! Xác thực không hợp lệ";
                        await logError(1, 'Captcha verification failed', { response: JSON.stringify(captchaResponse) });
                        return res.json(resultData);
                    }

                    if (captchaResponse.data && captchaResponse.data.success && captchaResponse.data.score && captchaResponse.data.score <= 0.5) {
                        resultData.message = "Đăng nhập không thành công! Hoạt động đáng ngờ được phát hiện";
                        await logError(1, 'Captcha low score', { score: captchaResponse.data.score });
                        return res.json(resultData);
                    }
                    await logInfo(1, 'CAPTCHA_OK', true, { score: captchaResponse.data?.score });
                } catch (captchaError) {
                    await logError(1, 'Captcha API error', { error: captchaError.message });
                    // Continue without captcha on API error
                }
            }

            // Step 2: Query user from database
            const { email, password } = validation.data;
            console.log('[LOGIN] Step 2: Querying database for user...');

            try {
                await logInfo(2, 'DB_QUERY_START', true, { email });
                
                const userResult = await commonService.getAllDataTable('user', { email: email });
                
                console.log('[LOGIN] DB Query result:', JSON.stringify({
                    success: userResult.success,
                    hasData: !!userResult.data,
                    dataLength: userResult.data?.length,
                    message: userResult.message
                }));

                await logInfo(2, 'DB_QUERY_RESULT', userResult.success, {
                    querySuccess: userResult.success,
                    dataLength: userResult.data?.length || 0,
                    message: userResult.message || ''
                });

                if (!userResult.success) {
                    await logError(2, 'Database query failed', { message: userResult.message });
                    resultData.message = 'Lỗi truy vấn cơ sở dữ liệu: ' + (userResult.message || 'Unknown');
                    return res.status(500).json(resultData);
                }

                if (!userResult.data || userResult.data.length === 0) {
                    resultData.message = 'Tài khoản không tồn tại';
                    await logError(2, 'User not found', { email });
                    return res.json(resultData);
                }

                const user = userResult.data[0];
                console.log('[LOGIN] User found:', { id: user.id, email: user.email, active: user.active });
                await logInfo(2, 'USER_FOUND', true, { userId: Number(user.id) });

                // Step 3: Verify password
                console.log('[LOGIN] Step 3: Verifying password...');
                try {
                    const isValidPassword = await bcrypt.compare(password, user.password);
                    await logInfo(3, 'PASSWORD_CHECK', isValidPassword, {});
                    
                    if (!isValidPassword) {
                        resultData.message = 'Sai mật khẩu';
                        await logError(3, 'Invalid password', { email });
                        return res.json(resultData);
                    }
                } catch (bcryptError) {
                    await logError(3, 'Bcrypt error', { error: bcryptError.message });
                    resultData.message = 'Lỗi xác thực mật khẩu';
                    return res.status(500).json(resultData);
                }

                // Check if account is active
                if (user.active !== 1) {
                    resultData.message = 'Tài khoản chưa được kích hoạt';
                    await logError(3, 'Account not active', { email, active: user.active });
                    return res.json(resultData);
                }

                // Step 4: Create JWT token
                console.log('[LOGIN] Step 4: Creating JWT token...');
                try {
                    const { token: jwtToken, tokenId } = jwtService.createToken(user);
                    await logInfo(4, 'TOKEN_CREATED', true, { tokenId });

                    // Get device info
                    const deviceInfo = jwtService.getDeviceInfo(req);
                    console.log('[LOGIN] Device info:', JSON.stringify(deviceInfo));

                    // Step 5: Save session to database
                    console.log('[LOGIN] Step 5: Saving session to database...');
                    const saveResult = await jwtService.saveTokenToDatabase(user.id, tokenId, deviceInfo, clientIp);
                    
                    await logInfo(5, 'SESSION_SAVE', saveResult.success, {
                        sessionId: saveResult.sessionId || null,
                        message: saveResult.message || ''
                    });

                    if (!saveResult.success) {
                        await logError(5, 'Session save failed', { message: saveResult.message });
                        resultData.message = saveResult.message;
                        return res.status(500).json(resultData);
                    }

                    // Step 6: Set JWT cookie
                    console.log('[LOGIN] Step 6: Setting JWT cookie...');
                    req.app.locals.setJWTCookie(res, jwtToken);

                    resultData = securityService.createSuccessResponse(null, 'Đăng nhập thành công');

                    // Log successful login
                    await auditService.logAuthEvent(email, 'LOGIN', true, {
                        userId: Number(user.id),
                        deviceInfo: deviceInfo.deviceName,
                        tokenId: tokenId
                    }, clientIp);

                    console.log('[LOGIN] ========== LOGIN SUCCESS ==========');
                    commonService.sendMessageTelegram(`✅ [LOGIN SUCCESS] ${email} - Device: ${deviceInfo.deviceName}`);
                    return res.json(resultData);

                } catch (tokenError) {
                    await logError(4, 'Token/Session error', { error: tokenError.message });
                    resultData.message = 'Lỗi tạo phiên đăng nhập';
                    return res.status(500).json(resultData);
                }

            } catch (dbError) {
                await logError(2, 'Database error', { error: dbError.message, stack: dbError.stack?.substring(0, 200) });
                resultData.message = 'Lỗi cơ sở dữ liệu: ' + dbError.message;
                return res.status(500).json(resultData);
            }

        } catch (globalError) {
            await logError('global', 'Global error', { error: globalError.message, stack: globalError.stack?.substring(0, 200) });
            commonService.saveLog(req, globalError.message, globalError.stack);
            resultData.message = 'Đã xảy ra lỗi: ' + globalError.message;
            return res.status(500).json(resultData);
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
