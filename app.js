var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var favicon = require('serve-favicon');

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
var apiRouter = require('./routes/api');

var db = require("./config/db");
db.connect('development', function () {
  console.log('Connect Database successfully');
})

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Asset version for cache-busting across all views
try {
  const pkg = require('./package.json');
  app.locals.assetVersion = process.env.ASSET_VERSION || pkg.version || '1.0.0';
} catch (e) {
  app.locals.assetVersion = process.env.ASSET_VERSION || '1.0.0';
}

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', '/images', 'favicon.ico')));

// JWT Middleware - Kiểm tra và decode token
const authenticateToken = async (req, res, next) => {
  // Lấy token từ cookie hoặc header
  const token = req.cookies.token ||
    (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const jwtService = require('./services/jwtService');
    const decoded = jwtService.verifyToken(token);

    if (!decoded) {
      req.user = null;
      res.clearCookie('token');
      return next();
    }

    // Kiểm tra token có hợp lệ trong database không (sử dụng bảng user_sessions)
    const validationResult = await jwtService.validateTokenInDatabase(decoded.id, decoded.tokenId);

    if (!validationResult.valid) {
      req.user = null;
      res.clearCookie('token');
      return next();
    }

    const user = validationResult.user;

    // Lấy đầy đủ thông tin user bao gồm role từ userService
    const userService = require('./services/userService');
    const fullUserInfo = await userService.getUserDetails(user.id);

    if (!fullUserInfo) {
      req.user = null;
      res.clearCookie('token');
      return next();
    }

    // Gán thông tin user đầy đủ vào request
    req.user = {
      id: fullUserInfo.id,
      email: fullUserInfo.email,
      fullname: fullUserInfo.fullname,
      active: fullUserInfo.active,
      role_id: fullUserInfo.role_id,
      isAdmin: fullUserInfo.isAdmin,
      tokenId: decoded.tokenId,
      campaign_id: fullUserInfo.campaign_id
    };

    // Làm mới token nếu sắp hết hạn (optional)
    const newToken = jwtService.refreshTokenIfNeeded(decoded);
    if (newToken) {
      res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
      });
    }
  } catch (error) {
    console.log('JWT Error:', error.message);
    req.user = null;
    // Xóa cookie không hợp lệ
    res.clearCookie('token');
  }

  next();
};

// Áp dụng JWT middleware cho tất cả routes
app.use(authenticateToken);

// Helper functions để sử dụng trong routes
app.locals.createJWT = (user) => {
  const jwtService = require('./services/jwtService');
  return jwtService.createToken(user).token;
};

app.locals.setJWTCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true for HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  });
};

app.locals.clearJWTCookie = (res) => {
  res.clearCookie('token');
};

app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log('err', err);
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
