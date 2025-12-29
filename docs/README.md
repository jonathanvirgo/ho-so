# 📚 Tài liệu Hệ thống - Patients Management System

## 🎯 Mục đích tài liệu

Bộ tài liệu này được tạo ra để lưu trữ thông tin chi tiết về cấu trúc và chức năng của hệ thống quản lý bệnh nhân và khảo sát y tế. Mục đích chính:

1. **Hiểu rõ hệ thống**: Cung cấp cái nhìn tổng quan về toàn bộ dự án
2. **Hỗ trợ phát triển**: Giúp developers mới hiểu nhanh codebase
3. **Bảo trì hệ thống**: Hướng dẫn vận hành và troubleshooting
4. **Mở rộng tính năng**: Cung cấp kiến thức cần thiết để phát triển thêm

## 📋 Danh sách Tài liệu

### 1. 🏥 [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
**Tổng quan Dự án**
- Mục đích chính của hệ thống
- Đối tượng sử dụng (bác sĩ, nhà nghiên cứu, admin, bệnh nhân)
- Kiến trúc tổng thể (Node.js + Express + MySQL + SQLite)
- Các chuyên khoa được hỗ trợ (viêm gan, uốn ván, phẫu thuật gan, etc.)
- Hệ thống phân quyền và bảo mật
- Tính năng đặc biệt (khảo sát, automation, multi-device)

**Khi nào sử dụng**: Đọc đầu tiên để hiểu tổng quan về dự án

### 2. 🎮 [CONTROLLERS_STRUCTURE.md](./CONTROLLERS_STRUCTURE.md)
**Cấu trúc Controllers**
- 22 controllers chính được phân loại theo chức năng
- Medical controllers cho từng chuyên khoa
- Survey system controllers
- User management và admin controllers
- Security patterns áp dụng cho tất cả controllers
- CRUD operations và role-based access control

**Khi nào sử dụng**: Khi cần hiểu logic nghiệp vụ hoặc thêm/sửa controllers

### 3. ⚙️ [SERVICES_ARCHITECTURE.md](./SERVICES_ARCHITECTURE.md)
**Kiến trúc Services**
- 15 services hỗ trợ toàn hệ thống
- Security services (authentication, authorization, audit)
- Data management services (SQLite, DataTables, cache)
- Integration services (Google Sheets, email, webhooks)
- Service composition patterns và dependency injection

**Khi nào sử dụng**: Khi cần hiểu các dịch vụ hỗ trợ hoặc tích hợp external APIs

### 4. 🗄️ [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
**Cấu trúc Cơ sở Dữ liệu**
- Dual database architecture (MySQL + SQLite)
- Schema chi tiết cho tất cả tables
- Relationships và constraints
- Role-based data access patterns
- Security features và performance optimization

**Khi nào sử dụng**: Khi cần hiểu cấu trúc dữ liệu hoặc thêm/sửa database schema

### 5. 🛣️ [ROUTES_STRUCTURE.md](./ROUTES_STRUCTURE.md)
**Cấu trúc Định tuyến**
- 4 route files chính với 100+ routes
- Medical specialty routes cho từng chuyên khoa
- Survey system routes
- Security patterns cho mọi route
- Role-based routing và permissions

**Khi nào sử dụng**: Khi cần hiểu URL structure hoặc thêm/sửa routes

### 6. 🔐 [SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md)
**Triển khai Bảo mật**
- Multi-layer security architecture
- JWT authentication với multi-device support
- Role-based access control (RBAC)
- Data protection và audit logging
- Input validation và session security

**Khi nào sử dụng**: Khi cần hiểu hoặc cải thiện bảo mật hệ thống

### 7. 🎨 [FRONTEND_STRUCTURE.md](./FRONTEND_STRUCTURE.md)
**Cấu trúc Frontend**
- Server-side rendering với EJS templates
- CSS architecture với Bootstrap 5
- JavaScript components và modules
- Progressive Web App (PWA) features
- Mobile optimization và responsive design

**Khi nào sử dụng**: Khi cần hiểu hoặc phát triển giao diện người dùng

### 8. 🚀 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
**Hướng dẫn Triển khai**
- System requirements và dependencies
- Environment configuration
- Database setup và migrations
- PM2 configuration và Nginx setup
- SSL, monitoring, backup strategies

**Khi nào sử dụng**: Khi cần deploy hệ thống lên production hoặc setup môi trường mới

## 🔍 Cách sử dụng Tài liệu

### Cho Developer mới
1. Đọc **PROJECT_OVERVIEW.md** để hiểu tổng quan
2. Đọc **CONTROLLERS_STRUCTURE.md** để hiểu business logic
3. Đọc **DATABASE_SCHEMA.md** để hiểu cấu trúc dữ liệu
4. Đọc **SECURITY_IMPLEMENTATION.md** để hiểu bảo mật

### Cho Frontend Developer
1. **FRONTEND_STRUCTURE.md** - Hiểu cấu trúc giao diện
2. **ROUTES_STRUCTURE.md** - Hiểu API endpoints
3. **PROJECT_OVERVIEW.md** - Hiểu business requirements

### Cho DevOps/SysAdmin
1. **DEPLOYMENT_GUIDE.md** - Hướng dẫn triển khai chi tiết
2. **DATABASE_SCHEMA.md** - Setup database
3. **SECURITY_IMPLEMENTATION.md** - Security configurations

### Cho Product Manager/Business Analyst
1. **PROJECT_OVERVIEW.md** - Hiểu tính năng và đối tượng sử dụng
2. **CONTROLLERS_STRUCTURE.md** - Hiểu các module chức năng
3. **FRONTEND_STRUCTURE.md** - Hiểu user experience

## 🔄 Cập nhật Tài liệu

### Khi nào cần cập nhật
- Thêm tính năng mới
- Thay đổi cấu trúc database
- Cập nhật security policies
- Thay đổi deployment process
- Refactor major components

### Quy trình cập nhật
1. Xác định file tài liệu cần cập nhật
2. Cập nhật nội dung theo template hiện tại
3. Review và test các thay đổi
4. Commit cùng với code changes

## 📊 Thống kê Hệ thống

### Quy mô Code
- **Controllers**: 22 files
- **Services**: 15 files  
- **Routes**: 100+ endpoints
- **Database Tables**: 20+ tables
- **Views**: 50+ EJS templates

### Tính năng chính
- **5 chuyên khoa y tế**: Viêm gan, uốn ván, phẫu thuật gan, nghiên cứu, tiêu chuẩn
- **Survey system**: Tạo khảo sát, quản lý responses, analytics
- **Food management**: Quản lý dinh dưỡng và khẩu phần ăn
- **Multi-device support**: Đăng nhập đồng thời nhiều thiết bị
- **Google Sheets integration**: Tự động đồng bộ dữ liệu

### Security Features
- JWT authentication
- Role-based access control
- Audit logging
- Input validation
- SQL injection prevention
- XSS protection

## 🎯 Roadmap Tài liệu

### Tài liệu bổ sung cần tạo
1. **API_DOCUMENTATION.md** - Chi tiết REST APIs
2. **TESTING_GUIDE.md** - Hướng dẫn testing
3. **TROUBLESHOOTING.md** - Xử lý sự cố thường gặp
4. **PERFORMANCE_OPTIMIZATION.md** - Tối ưu hiệu suất
5. **INTEGRATION_GUIDE.md** - Tích hợp với hệ thống khác

### Cải tiến tài liệu hiện tại
1. Thêm diagrams và flowcharts
2. Thêm code examples chi tiết hơn
3. Thêm video tutorials
4. Tạo interactive documentation

## 📞 Liên hệ và Hỗ trợ

### Khi cần hỗ trợ
1. Đọc tài liệu liên quan trước
2. Check existing issues/tickets
3. Tạo issue mới với thông tin chi tiết
4. Tag appropriate team members

### Đóng góp tài liệu
1. Fork repository
2. Tạo branch cho documentation updates
3. Follow existing documentation style
4. Submit pull request với clear description

---

**Lưu ý**: Tài liệu này được tạo tự động dựa trên phân tích codebase. Vui lòng cập nhật khi có thay đổi trong hệ thống.
