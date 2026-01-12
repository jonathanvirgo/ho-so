 var passport        = require('passport');
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

module.exports = function(passport) {
    // JWT Strategy (for protected routes)
    passport.use(new JwtStrategy({
        jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract from cookie first
        (req) => {
            let token = null;
            if (req && req.cookies) {
                token = req.cookies['token'];
            }
            return token;
        },
        // Fallback to Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken()
        ]),
        secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
    },
    async function(jwt_payload, done) {
        try {
            // Sử dụng JWT service để kiểm tra token với multi-device support
            const jwtService = require('../services/jwtService');
            const validationResult = await jwtService.validateTokenInDatabase(jwt_payload.id, jwt_payload.tokenId);
            
            if (validationResult.valid) {
                const user = validationResult.user;
                
                if (user.active == 0) {
                    return done(null, false, { message: 'Tài khoản chưa được kích hoạt.' });
                }
                
                return done(null, user);
            } else {
                return done(null, false, { message: validationResult.message || 'Phiên đăng nhập không hợp lệ.' });
            }
        } catch (error) {
            return done(error, false);
        }
    }));
}
