# 🎮 Cấu trúc Controllers - Hệ thống Quản lý Bệnh nhân

## 📋 Tổng quan Controllers

Hệ thống có **22 controllers** chính, được chia thành các nhóm chức năng:

## 🏥 Medical Controllers (Chuyên khoa)

### 1. hepatitisController.js
- **Chức năng**: Quản lý bệnh nhân viêm gan
- **Routes**: `/viem-gan/*`
- **CRUD Operations**: Create, Read, Update, Delete bệnh nhân viêm gan
- **Role Access**: role_id = 3 (Viêm gan)
- **Security**: Role-based filtering, audit logging

### 2. hepstitisMt1Controller.js  
- **Chức năng**: Quản lý viêm gan MT1 (loại đặc biệt)
- **Routes**: `/viem-gan-mt1/*`
- **CRUD Operations**: Quản lý bệnh nhân viêm gan MT1
- **Role Access**: role_id = 6 (Viêm gan MT1)
- **Security**: Restricted access, data filtering

### 3. tetanusController.js
- **Chức năng**: Quản lý bệnh nhân uốn ván
- **Routes**: `/uon-van/*`
- **CRUD Operations**: Quản lý tiêm chủng, theo dõi uốn ván
- **Role Access**: role_id = 4 (Uốn ván)
- **Features**: Vaccination tracking, prevention protocols

### 4. liverSurgeryController.js
- **Chức năng**: Quản lý phẫu thuật gan
- **Routes**: `/hoi-chan/*`
- **CRUD Operations**: Hồ sơ phẫu thuật, theo dõi hậu phẫu
- **Role Access**: role_id = 5 (Hội chẩn)
- **Features**: Surgery records, post-op monitoring

### 5. researchController.js
- **Chức năng**: Nghiên cứu y khoa
- **Routes**: `/research/*`
- **CRUD Operations**: Quản lý dự án nghiên cứu, dữ liệu nghiên cứu
- **Role Access**: role_id = 7 (Nghiên cứu)
- **Features**: Research projects, data analysis

### 6. standardController.js
- **Chức năng**: Quản lý tiêu chuẩn y tế
- **Routes**: `/standard/*`
- **CRUD Operations**: Tiêu chuẩn, quy trình, guidelines
- **Role Access**: role_id = 8 (Tiêu chuẩn)
- **Features**: Medical standards, protocols

## 👤 User Management Controllers

### 7. userController.js
- **Chức năng**: Quản lý người dùng
- **Key Methods**:
  - `login()` - Đăng nhập với JWT
  - `signUp()` - Đăng ký tài khoản
  - `logout()` - Đăng xuất
  - `getProfile()` - Thông tin cá nhân
- **Security**: JWT authentication, multi-device support
- **Features**: Password encryption, session management

### 8. adminController.js
- **Chức năng**: Quản trị hệ thống
- **Key Methods**:
  - User management
  - System configuration
  - Role assignment
  - System monitoring
- **Role Access**: role_id = 1 (Admin only)

## 🏠 Core Controllers

### 9. homeController.js
- **Chức năng**: Trang chủ và điều hướng
- **Key Methods**:
  - `index()` - Trang chủ với role-based redirect
  - `chat()` - AI chat integration
- **Role Routing**:
  ```javascript
  role_id 1 → Admin dashboard
  role_id 3 → /viem-gan
  role_id 4 → /uon-van  
  role_id 5 → /hoi-chan
  role_id 6 → /viem-gan-mt1
  role_id 7 → /research
  role_id 8 → /standard
  ```

### 10. defaultController.js
- **Chức năng**: Xử lý mặc định, fallback routes
- **Features**: Error handling, default responses

## 📊 Survey System Controllers

### 11. projectController.js
- **Chức năng**: Quản lý dự án khảo sát
- **Key Methods**:
  - `getList()` - Danh sách dự án
  - `create()` - Tạo dự án mới
  - `update()` - Cập nhật dự án
  - `delete()` - Xóa dự án (soft delete)
- **Features**: Google Sheets integration, SQLite support

### 12. surveyConfigController.js
- **Chức năng**: Cấu hình khảo sát
- **Key Methods**:
  - `getList()` - Danh sách khảo sát
  - `create()` - Tạo cấu hình khảo sát
  - `getFieldsConfig()` - Cấu hình trường
  - `saveFieldsConfig()` - Lưu cấu hình
- **Features**: Drag & drop field builder, validation rules

### 13. surveyController.js
- **Chức năng**: Form khảo sát công khai
- **Key Methods**:
  - `getPublicSurvey()` - Hiển thị form công khai
  - `submitPublicSurvey()` - Xử lý submit
- **Features**: Public access (no auth), custom slug URLs

### 14. surveyDataController.js
- **Chức năng**: Quản lý dữ liệu khảo sát
- **Key Methods**:
  - `getResponses()` - Danh sách phản hồi
  - `exportData()` - Xuất dữ liệu
  - `getAnalytics()` - Phân tích dữ liệu
- **Features**: Data visualization, export to Excel/Sheets

## 🍽️ Food Management Controllers

### 15. foodRationController.js
- **Chức năng**: Quản lý khẩu phần ăn
- **Features**: Nutrition calculation, meal planning

### 16. dishController.js
- **Chức năng**: Quản lý món ăn
- **Features**: Recipe management, ingredient tracking

### 17. importFoodController.js
- **Chức năng**: Import dữ liệu thực phẩm
- **Features**: Bulk import, data validation

## 🔧 System Controllers

### 18. deviceController.js
- **Chức năng**: Quản lý thiết bị
- **Features**: Multi-device support, device tracking

### 19. fileUploadController.js
- **Chức năng**: Upload file
- **Key Methods**:
  - `uploadSingle()` - Upload file đơn
  - `uploadMultiple()` - Upload nhiều file
- **Features**: File validation, storage management

### 20. automationController.js
- **Chức năng**: Tự động hóa
- **Features**: Webhook integration, automated tasks

### 21. patientController.js
- **Chức năng**: Quản lý bệnh nhân chung
- **Features**: Patient records, medical history

## 🔐 Security Pattern cho tất cả Controllers

### Middleware Stack
```javascript
// GET routes
commonService.isAuthenticated + 
securityService.requirePermission

// POST routes  
commonService.isAuthenticatedPost + 
auditService.createAuditMiddleware
```

### Role-based Data Filtering
- **Regular users**: Chỉ thấy records có `created_by = user.id`
- **Admin users**: Thấy tất cả records
- **Unauthorized access**: Trả về lỗi "you do not have permission to access"

### CRUD Permissions
- **Create**: Requires write permission
- **Read**: Requires read permission  
- **Update**: Requires write permission + ownership check
- **Delete**: Requires delete permission + ownership check

## 📝 Controller Template Pattern

Tất cả controllers tuân theo pattern chuẩn:
```javascript
// 1. Authentication check
// 2. Permission validation
// 3. Data filtering by role
// 4. Business logic execution
// 5. Audit logging
// 6. Response formatting
```
