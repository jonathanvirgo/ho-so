# 🏥 Tổng quan Dự án - Hệ thống Quản lý Bệnh nhân và Khảo sát Y tế

## 📋 Mục đích chính
Hệ thống quản lý bệnh nhân và khảo sát y tế toàn diện, hỗ trợ nhiều loại bệnh và nghiên cứu y khoa với tích hợp Google Sheets và SQLite.

## 🎯 Đối tượng sử dụng
- **Bác sĩ/Y tá**: Quản lý hồ sơ bệnh nhân
- **Nhà nghiên cứu**: Thực hiện khảo sát và nghiên cứu y khoa
- **Quản trị viên**: Quản lý hệ thống và phân quyền
- **Bệnh nhân**: Tham gia khảo sát trực tuyến

## 🏗️ Kiến trúc tổng thể

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: MySQL (chính) + SQLite (phụ trợ)
- **View Engine**: EJS
- **Authentication**: JWT + Passport.js
- **External Integration**: Google Sheets API
- **Frontend**: Bootstrap + jQuery + DataTables

### Mô hình MVC
```
├── Models (Database)
│   ├── MySQL - Dữ liệu chính
│   └── SQLite - Dữ liệu khảo sát
├── Views (EJS Templates)
│   ├── Admin panels
│   ├── Patient forms
│   └── Survey interfaces
└── Controllers
    ├── Medical controllers
    ├── Survey controllers
    └── Admin controllers
```

## 🏥 Các chuyên khoa được hỗ trợ

### 1. Viêm gan (Hepatitis)
- **Controller**: `hepatitisController.js`
- **Routes**: `/viem-gan/*`
- **Chức năng**: Quản lý bệnh nhân viêm gan, theo dõi điều trị

### 2. Viêm gan MT1 (Hepatitis MT1)
- **Controller**: `hepstitisMt1Controller.js`
- **Routes**: `/viem-gan-mt1/*`
- **Chức năng**: Quản lý viêm gan loại MT1 đặc biệt

### 3. Uốn ván (Tetanus)
- **Controller**: `tetanusController.js`
- **Routes**: `/uon-van/*`
- **Chức năng**: Quản lý bệnh nhân uốn ván, tiêm chủng

### 4. Phẫu thuật gan (Liver Surgery)
- **Controller**: `liverSurgeryController.js`
- **Routes**: `/hoi-chan/*`
- **Chức năng**: Quản lý bệnh nhân phẫu thuật gan

### 5. Nghiên cứu y khoa (Research)
- **Controller**: `researchController.js`
- **Routes**: `/research/*`
- **Chức năng**: Thực hiện các nghiên cứu y khoa

### 6. Tiêu chuẩn y tế (Standards)
- **Controller**: `standardController.js`
- **Routes**: `/standard/*`
- **Chức năng**: Quản lý tiêu chuẩn và quy trình y tế

## 👥 Hệ thống phân quyền

### Roles (role_id)
1. **Admin (1)**: Toàn quyền hệ thống
2. **User thường (2)**: Quyền cơ bản
3. **Viêm gan (3)**: Chuyên khoa viêm gan
4. **Uốn ván (4)**: Chuyên khoa uốn ván
5. **Hội chẩn (5)**: Phẫu thuật gan
6. **Viêm gan MT1 (6)**: Chuyên khoa viêm gan MT1
7. **Nghiên cứu (7)**: Nhà nghiên cứu
8. **Tiêu chuẩn (8)**: Quản lý tiêu chuẩn

### Permissions
- **Read**: Xem dữ liệu
- **Write**: Tạo/sửa dữ liệu
- **Delete**: Xóa dữ liệu
- **Admin**: Quản trị hệ thống

## 🔐 Bảo mật

### Authentication
- **JWT Tokens**: Xác thực người dùng
- **Multi-device Support**: Hỗ trợ đăng nhập nhiều thiết bị
- **Session Management**: Quản lý phiên đăng nhập
- **Password Encryption**: Mã hóa mật khẩu với bcrypt

### Authorization
- **Role-based Access Control**: Phân quyền theo vai trò
- **Resource-level Permissions**: Quyền truy cập từng tài nguyên
- **Data Filtering**: Lọc dữ liệu theo quyền hạn
- **Audit Logging**: Ghi log hoạt động

## 📊 Hệ thống khảo sát

### Tính năng chính
- **Tạo khảo sát**: Giao diện drag & drop
- **Quản lý dự án**: Tổ chức khảo sát theo dự án
- **Form công khai**: URL slug tùy chỉnh
- **Tích hợp Google Sheets**: Tự động đồng bộ dữ liệu
- **SQLite Storage**: Lưu trữ dữ liệu khảo sát

### Loại trường hỗ trợ
- Text, Email, Number, Date
- Select, Multi-select, Radio, Checkbox
- Textarea, File upload
- Rating, Scale

## 🍽️ Quản lý dinh dưỡng

### Food Management
- **Controller**: `foodRationController.js`, `dishController.js`
- **Chức năng**: 
  - Quản lý khẩu phần ăn
  - Tính toán dinh dưỡng
  - Menu mẫu
  - Import/Export dữ liệu thực phẩm

## 🔧 Tính năng đặc biệt

### 1. Multi-device Support
- Đăng nhập đồng thời nhiều thiết bị
- Quản lý session riêng biệt
- Logout từ xa

### 2. Automation System
- **Webhook Integration**: Tích hợp webhook
- **Email Automation**: Gửi email tự động
- **Survey Invitations**: Mời tham gia khảo sát
- **Reminder System**: Nhắc nhở tự động

### 3. Data Export/Import
- **Excel Export**: Xuất dữ liệu Excel
- **Google Sheets Sync**: Đồng bộ Google Sheets
- **Template System**: Hệ thống template
- **Bulk Operations**: Thao tác hàng loạt

### 4. Responsive Design
- **Mobile-first**: Thiết kế mobile trước
- **DataTables**: Bảng dữ liệu responsive
- **Progressive Web App**: Hỗ trợ PWA

## 📁 Cấu trúc thư mục chính

```
├── controllers/     # Logic xử lý nghiệp vụ
├── services/        # Dịch vụ hỗ trợ
├── routes/          # Định tuyến URL
├── views/           # Giao diện người dùng
├── config/          # Cấu hình hệ thống
├── database/        # Database và migrations
├── public/          # Tài nguyên tĩnh
├── docs/            # Tài liệu hướng dẫn
└── test/            # Test và debugging
```

## 🚀 Deployment
- **Environment**: Node.js production
- **Database**: MySQL + SQLite
- **External Services**: Google Sheets API
- **Security**: HTTPS, JWT, CORS
