# Hướng Dẫn Triển Khai JWT Authentication & Quản Lý Thiết Bị

Tài liệu này hướng dẫn cách tích hợp hệ thống xác thực JWT (JSON Web Token) và quản lý session nhiều thiết bị (Multi-device Login) vào dự án Node.js/Express.

## 1. Cấu Trúc Database

Tạo các bảng `user_sessions` và `user_session_settings` để lưu trữ token và cài đặt của user.

```sql
-- Bảng lưu trữ lịch sử đăng nhập và session
CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(10) UNSIGNED NOT NULL,
  `jwt_token_id` varchar(255) NOT NULL,
  `device_name` varchar(255) DEFAULT NULL COMMENT 'Tên thiết bị (tự động detect)',
  `device_type` enum('desktop','mobile','tablet','unknown') DEFAULT 'unknown',
  `browser` varchar(100) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `device_info` text DEFAULT NULL COMMENT 'Thông tin thiết bị chi tiết',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL COMMENT 'Vị trí đăng nhập (nếu có)',
  `login_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_activity` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `logout_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_current_session` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_token` (`user_id`,`jwt_token_id`),
  KEY `idx_expires` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Bảng cài đặt session cho từng user
CREATE TABLE `user_session_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(10) UNSIGNED NOT NULL,
  `max_sessions` int(11) DEFAULT 5,
  `session_timeout_hours` int(11) DEFAULT 24,
  `allow_multiple_devices` tinyint(1) DEFAULT 1,
  `notify_new_login` tinyint(1) DEFAULT 1,
  `auto_logout_inactive` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

## 2. Cài Đặt Dependencies

Cài đặt các thư viện cần thiết:

```bash
npm install jsonwebtoken bcrypt
```

## 3. Các Services Cần Thiết

### 3.1. `services/jwtService.js`
Service này chịu trách nhiệm tạo, xác thực và lưu JWT token.

**Các hàm chính:**
- `createToken(user)`: Tạo JWT mới.
- `verifyToken(token)`: Xác thực signature của token.
- `saveTokenToDatabase(...)`: Lưu session mới, xử lý logic đa thiết bị (xóa session cũ nếu không cho phép multi-device).
- `validateTokenInDatabase(...)`: Kiểm tra token có còn active trong DB không (xử lý logout từ xa).
- `getDeviceInfo(req)`: Lấy thông tin cơ bản từ request.

### 3.2. `services/multiDeviceService.js`
Service này quản lý chi tiết các session và parsing User-Agent.

**Các hàm chính:**
- `detectDeviceInfo(userAgent)`: Parse UA string để lấy tên thiết bị, OS, browser.
- `createSession(...)`: Insert record vào `user_sessions`, handle giới hạn số lượng session (`max_sessions`).
- `logoutSession(tokenId)`: Deactivate một session cụ thể.
- `logoutAllOtherSessions(...)`: Deactivate các session khác ngoại trừ session hiện tại.

## 4. Tích Hợp Vào Controller

### 4.1. Login (Trong `userController.js`)

```javascript
// 1. Validate user & password
const user = ...; // Lấy từ DB
const isValidPassword = await bcrypt.compare(password, user.password);

// 2. Tạo Token
const { token: jwtToken, tokenId } = jwtService.createToken(user);

// 3. Lấy thông tin thiết bị & Lưu vào DB
const deviceInfo = jwtService.getDeviceInfo(req);
await jwtService.saveTokenToDatabase(user.id, tokenId, deviceInfo, req.ip);

// 4. Set Cookie hoặc trả về Token
res.cookie('token', jwtToken, { httpOnly: true, secure: true, ... });
res.json({ success: true, token: jwtToken });
```

### 4.2. Logout (Trong `userController.js`)

```javascript
// Xóa token trong DB trước khi xóa cookie
if (req.user && req.user.tokenId) {
    await jwtService.removeTokenFromDatabase(req.user.id, req.user.tokenId);
}
res.clearCookie('token');
```

## 5. Quản Lý Thiết Bị (`deviceController.js` & `devices.ejs`)

Tạo API để user xem danh sách thiết bị và có thể logout từ xa.

**API Endpoints:**
- `GET /devices`: Lấy danh sách thiết bị (gọi `jwtService.getActiveDevices`).
- `POST /devices/logout`: Logout một thiết bị cụ thể (gọi `multiDeviceService.logoutSession`).
- `POST /devices/logout-all-others`: Logout tất cả trừ thiết bị hiện tại.
- `POST /devices/settings`: Cập nhật cấu hình (số session tối đa, timeout...).

**Giao diện (`views/devices.ejs`):**
- Hiển thị danh sách cards thiết bị.
- Highlight "Thiết bị hiện tại".
- Nút "Logout" cho các thiết bị khác.
- Form cài đặt `Max Sessions`, `Timeout`.

## 6. Middleware Xác Thực (`app.js`)

Middleware `authenticateToken` sẽ chạy trên mọi request cần bảo mật:

1. Lấy token từ Cookie hoặc Header `Authorization`.
2. Verify signature (`jwt.verify`).
3. **Quan trọng:** Kiểm tra DB (`jwtService.validateTokenInDatabase`).
    - Nếu record trong `user_sessions` bị `is_active = 0` (do đã bị logout từ thiết bị khác), từ chối request ngay lập tức -> **Cơ chế Revoke Token tức thì**.
4. Attach user info vào `req.user`.

```javascript
const authenticateToken = async (req, res, next) => {
    // ... get token
    const decoded = jwtService.verifyToken(token);
    
    // Check DB status (để hỗ trợ remote logout)
    const dbCheck = await jwtService.validateTokenInDatabase(decoded.id, decoded.tokenId);
    if (!dbCheck.valid) {
        res.clearCookie('token');
        return next(); // Hoặc return 401
    }
    
    req.user = { ...dbCheck.user, tokenId: decoded.tokenId };
    next();
};
```

## 7. Lưu Ý Bảo Mật

- **JWT Secret:** Luôn để trong biến môi trường (`process.env.JWT_SECRET`), không commit cứng vào code.
- **Cookie Security:** Sử dụng `httpOnly: true`, `secure: true` (trên PROD), `sameSite: 'strict'`.
- **User Agent:** Chỉ dùng để hiển thị thông tin gợi nhớ cho user, không dùng để định danh bảo mật tuyệt đối.

---
*Tài liệu này được tạo dựa trên source code hiện tại của dự án Patient Management.*
