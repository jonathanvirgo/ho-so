# ⚙️ Services Architecture - Hệ thống Dịch vụ

## 📋 Tổng quan Services

Hệ thống có **15 services** chính, cung cấp các dịch vụ hỗ trợ cho toàn bộ ứng dụng:

## 🔐 Security & Authentication Services

### 1. commonService.js
- **Chức năng**: Dịch vụ chung, authentication middleware
- **Key Methods**:
  - `isAuthenticated` - Middleware xác thực cho GET routes
  - `isAuthenticatedPost` - Middleware xác thực cho POST routes
  - `chatWithAIML()` - Tích hợp AI chat
- **Features**: JWT validation, user session management

### 2. securityService.js
- **Chức năng**: Bảo mật và phân quyền
- **Key Methods**:
  - `requirePermission(resource, action)` - Kiểm tra quyền
  - `createSuccessResponse()` - Format response thành công
  - `createErrorResponse()` - Format response lỗi
- **Features**: Role-based access control, permission validation

### 3. jwtService.js
- **Chức năng**: Quản lý JWT tokens
- **Key Methods**:
  - `createToken(user)` - Tạo JWT token với tokenId
  - `verifyToken(token)` - Xác thực token
  - `saveTokenToDatabase()` - Lưu token vào DB
  - `validateTokenInDatabase()` - Validate token trong DB
  - `getDeviceInfo()` - Lấy thông tin thiết bị
- **Features**: Multi-device support, token rotation, device tracking

### 4. auditService.js
- **Chức năng**: Ghi log và audit trail
- **Key Methods**:
  - `createAuditMiddleware` - Middleware ghi log cho POST routes
  - `logAuthEvent()` - Log sự kiện authentication
  - `logDataAccess()` - Log truy cập dữ liệu
- **Features**: Comprehensive logging, security monitoring

### 5. userService.js
- **Chức năng**: Quản lý người dùng
- **Key Methods**:
  - `getUserById()` - Lấy thông tin user
  - `updateUserProfile()` - Cập nhật profile
  - `validateUserPermissions()` - Kiểm tra quyền user
- **Features**: User management, profile handling

## 📊 Data Management Services

### 6. sqliteService.js
- **Chức năng**: Quản lý SQLite database
- **Key Methods**:
  - `createDatabase()` - Tạo SQLite DB mới
  - `executeQuery()` - Thực thi query
  - `insertData()` - Insert dữ liệu
  - `getData()` - Lấy dữ liệu
- **Features**: Survey data storage, offline capability

### 7. dataTableService.js
- **Chức năng**: Xử lý DataTables
- **Key Methods**:
  - `processDataTableRequest()` - Xử lý request DataTable
  - `applyFilters()` - Áp dụng filters
  - `formatResponse()` - Format response cho DataTable
- **Features**: Server-side processing, pagination, sorting

### 8. cacheService.js
- **Chức năng**: Quản lý cache
- **Key Methods**:
  - `set(key, value, ttl)` - Set cache
  - `get(key)` - Get cache
  - `del(key)` - Delete cache
  - `flush()` - Clear all cache
- **Features**: Memory caching, performance optimization

## 🔗 Integration Services

### 9. googleSheetsService.js
- **Chức năng**: Tích hợp Google Sheets
- **Key Methods**:
  - `createSheet()` - Tạo Google Sheet mới
  - `appendData()` - Thêm dữ liệu vào sheet
  - `updateSheet()` - Cập nhật sheet
  - `getSheetData()` - Lấy dữ liệu từ sheet
- **Features**: Auto-sync survey data, real-time updates

### 12. huggingFace.js
- **Chức năng**: Tích hợp AI/ML
- **Key Methods**:
  - `processText()` - Xử lý text với AI
  - `analyzeData()` - Phân tích dữ liệu
- **Features**: AI-powered analysis, natural language processing

## 🍽️ Domain-specific Services

### 13. foodService.js
- **Chức năng**: Quản lý thực phẩm và dinh dưỡng
- **Key Methods**:
  - `calculateNutrition()` - Tính toán dinh dưỡng
  - `searchFood()` - Tìm kiếm thực phẩm
  - `getFoodInfo()` - Lấy thông tin thực phẩm
- **Features**: Nutrition database, meal planning

## 🔧 System Services

### 15. multiDeviceService.js
- **Chức năng**: Hỗ trợ đa thiết bị
- **Key Methods**:
  - `registerDevice()` - Đăng ký thiết bị
  - `syncDeviceData()` - Đồng bộ dữ liệu
  - `manageDeviceSessions()` - Quản lý session thiết bị
- **Features**: Cross-device sync, session management

## 🏗️ Service Architecture Pattern

### Dependency Injection
```javascript
// Services được inject vào controllers
const commonService = require('../services/commonService');
const securityService = require('../services/securityService');
```

### Middleware Pattern
```javascript
// Security middleware stack
router.get('/route', 
  commonService.isAuthenticated,
  securityService.requirePermission('resource', 'action'),
  controller.method
);

router.post('/route',
  commonService.isAuthenticatedPost,
  auditService.createAuditMiddleware,
  controller.method
);
```

### Service Composition
```javascript
// Services có thể gọi lẫn nhau
class SurveyService {
  async createSurvey(data) {
    // 1. Validate permissions
    await securityService.checkPermission();
    
    // 2. Save to SQLite
    await sqliteService.createDatabase();
    
    // 3. Create Google Sheet
    await googleSheetsService.createSheet();
    
    // 4. Send notifications
    await emailService.sendNotification();
    
    // 5. Log activity
    await auditService.logActivity();
  }
}
```

## 🔄 Service Interactions

### Authentication Flow
```
Request → commonService.isAuthenticated → jwtService.verifyToken → userService.getUserById → Continue
```

### Authorization Flow
```
Request → securityService.requirePermission → Check user roles → Check resource permissions → Continue/Deny
```

### Data Access Flow
```
Controller → dataTableService.processRequest → Apply role filters → Return filtered data
```

### Audit Flow
```
POST Request → auditService.createAuditMiddleware → Log request → Execute → Log response
```

## 📈 Performance Optimizations

### Caching Strategy
- **User sessions**: Cached in memory
- **Permission checks**: Cached per request
- **Database queries**: Cached with TTL
- **API responses**: Cached for static data

### Database Optimization
- **Connection pooling**: MySQL connection pool
- **Query optimization**: Indexed queries
- **Data partitioning**: Separate SQLite per project

### External API Management
- **Rate limiting**: Google Sheets API calls
- **Retry logic**: Failed API calls
- **Fallback mechanisms**: Offline mode support

## 🛡️ Security Measures

### Input Validation
- **SQL Injection**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Token validation

### Data Protection
- **Encryption**: Sensitive data encryption
- **Access Control**: Role-based permissions
- **Audit Trail**: Complete activity logging
