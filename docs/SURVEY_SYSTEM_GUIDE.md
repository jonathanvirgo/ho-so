# Hướng dẫn Hệ thống Quản lý Dự án và Khảo sát

## Tổng quan

Hệ thống quản lý dự án và khảo sát cho phép tạo và quản lý các dự án khảo sát trực tuyến với tích hợp Google Sheets để lưu trữ dữ liệu.

## Tính năng chính

### 1. Quản lý Dự án
- Tạo, sửa, xóa dự án
- Tự động tạo Google Sheet cho mỗi dự án
- Quản lý trạng thái dự án (Hoạt động, Tạm dừng, Đã xóa)
- Phân quyền theo role-based access control

### 2. Cấu hình Khảo sát
- Tạo nhiều khảo sát cho một dự án
- Cấu hình URL slug cho khảo sát công khai
- Thiết lập các tùy chọn: cho phép nhiều phản hồi, bắt buộc email
- Tùy chỉnh thông báo thành công

### 3. Cấu hình Trường Khảo sát
- Hỗ trợ nhiều loại trường: text, textarea, select, multiselect, radio, checkbox, datetime, date, email, number
- Drag & drop để sắp xếp thứ tự trường
- Validation rules cho từng trường
- Tùy chọn bắt buộc/không bắt buộc

### 4. Form Khảo sát Công khai
- Giao diện responsive, thân thiện với mobile
- Tích hợp Virtual Select cho multiselect
- Tích hợp Flatpickr cho date/datetime picker
- Validation phía client và server
- Tự động lưu vào Google Sheets

## Cài đặt

### 1. Database Setup

Chạy script tạo database:

```sql
-- Chạy file: database/migrations/2025_08_19_survey_system.sql
```

### 2. Google Sheets API Setup

Tạo Service Account trên Google Cloud Console:

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Enable Google Sheets API và Google Drive API
4. Tạo Service Account:
   - Vào IAM & Admin > Service Accounts
   - Tạo service account mới
   - Tải về file JSON credentials
5. Cấu hình environment variables:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Dependencies

Các dependencies đã được cài đặt:
- google-spreadsheet
- google-auth-library
- Virtual Select (frontend)
- Flatpickr (frontend)

## Cấu trúc Database

### Bảng chính:

1. **projects** - Quản lý dự án
2. **survey_configs** - Cấu hình khảo sát
3. **survey_fields** - Các trường khảo sát
4. **survey_responses** - Phản hồi khảo sát
5. **survey_response_data** - Dữ liệu phản hồi chi tiết
6. **survey_templates** - Template khảo sát (tùy chọn)

## Routes

### Quản lý Dự án:
- `GET /projects` - Danh sách dự án
- `GET /projects/create` - Form tạo dự án
- `POST /projects/create` - Tạo dự án mới
- `GET /projects/:id/edit` - Form chỉnh sửa dự án
- `POST /projects/update` - Cập nhật dự án
- `POST /projects/:id/delete` - Xóa dự án

### Quản lý Khảo sát:
- `GET /projects/:projectId/surveys` - Danh sách khảo sát của dự án
- `GET /projects/:projectId/surveys/create` - Form tạo khảo sát
- `POST /survey-configs/create` - Tạo cấu hình khảo sát
- `GET /survey-configs/:id/fields` - Cấu hình trường khảo sát
- `POST /survey-configs/save-fields` - Lưu cấu hình trường

### Khảo sát Công khai:
- `GET /survey/:slug` - Form khảo sát công khai
- `POST /survey/:slug/submit` - Submit khảo sát

## Phân quyền

Hệ thống sử dụng role-based access control:

### Permissions cần thiết:
- `projects.read` - Xem danh sách dự án
- `projects.write` - Tạo/sửa dự án
- `projects.delete` - Xóa dự án
- `survey-configs.read` - Xem cấu hình khảo sát
- `survey-configs.write` - Tạo/sửa cấu hình khảo sát
- `survey-configs.delete` - Xóa cấu hình khảo sát

### Role filtering:
- User thường chỉ thấy dự án do họ tạo (`created_by`)
- Admin có thể thấy tất cả dự án
- Áp dụng `campaign_id` filtering nếu có

## Sử dụng

### 1. Tạo Dự án mới

1. Truy cập `/projects`
2. Click "Tạo Dự án Mới"
3. Điền thông tin dự án
4. Hệ thống tự động tạo Google Sheet

### 2. Tạo Khảo sát

1. Từ danh sách dự án, click "Quản lý Khảo sát"
2. Click "Tạo Khảo sát Mới"
3. Điền thông tin khảo sát và URL slug
4. Cấu hình các trường khảo sát

### 3. Cấu hình Trường

1. Từ danh sách khảo sát, click "Cấu hình Trường"
2. Thêm các trường cần thiết
3. Kéo thả để sắp xếp thứ tự
4. Cấu hình validation và tùy chọn
5. Lưu cấu hình

### 4. Chia sẻ Khảo sát

1. Copy URL khảo sát từ danh sách
2. Chia sẻ URL với người tham gia
3. Theo dõi phản hồi trong Google Sheet

## Loại Trường hỗ trợ

### Text Fields:
- **Text**: Nhập văn bản ngắn
- **Textarea**: Nhập văn bản dài
- **Email**: Nhập email với validation
- **Number**: Nhập số

### Selection Fields:
- **Select**: Chọn một tùy chọn từ dropdown
- **Multiselect**: Chọn nhiều tùy chọn (Virtual Select)
- **Radio**: Chọn một trong nhiều tùy chọn
- **Checkbox**: Chọn nhiều trong nhiều tùy chọn

### Date/Time Fields:
- **Date**: Chọn ngày (Flatpickr)
- **DateTime**: Chọn ngày và giờ (Flatpickr)

## Google Sheets Integration

### Tự động tạo Sheet:
- Mỗi dự án có một Google Sheet riêng
- Headers được tự động cập nhật khi thay đổi cấu hình trường
- Dữ liệu được append theo thời gian thực

### Cấu trúc dữ liệu trong Sheet:
- ID phản hồi
- Email người trả lời
- IP Address
- Các trường khảo sát (theo thứ tự cấu hình)
- Thời gian gửi

## Troubleshooting

### Lỗi Google Sheets API:

#### 1. TypeError: doc.useServiceAccountAuth is not a function
**Nguyên nhân:** Phiên bản google-spreadsheet mới có API khác
**Giải pháp:** Đã được sửa trong googleSheetsService.js
```javascript
// Cách cũ (lỗi):
const doc = new GoogleSpreadsheet();
doc.useServiceAccountAuth(serviceAccountAuth);

// Cách mới (đã sửa):
const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
```

#### 2. Credentials not configured
**Nguyên nhân:** Chưa cấu hình Google Service Account
**Giải pháp:**
1. Tạo Service Account trên Google Cloud Console
2. Enable Google Sheets API và Google Drive API
3. Tải file JSON credentials
4. Cấu hình environment variables:
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### 3. Permission denied errors
**Nguyên nhân:** Service Account không có quyền truy cập
**Giải pháp:**
1. Share Google Drive folder với Service Account email
2. Hoặc tạo sheet trong Drive của Service Account

### Lỗi Database:

#### 1. Table doesn't exist
**Nguyên nhân:** Chưa chạy migration script
**Giải pháp:**
```sql
mysql -u username -p database_name < database/migrations/2025_08_19_survey_system.sql
```

#### 2. Foreign key constraint fails
**Nguyên nhân:** Dữ liệu không đồng bộ
**Giải pháp:**
1. Kiểm tra project_id tồn tại khi tạo survey_config
2. Kiểm tra survey_config_id tồn tại khi tạo survey_fields

#### 3. JSON column errors
**Nguyên nhân:** MySQL version cũ không hỗ trợ JSON
**Giải pháp:** Upgrade MySQL >= 5.7 hoặc thay JSON bằng TEXT

### Lỗi Frontend:

#### 1. Virtual Select không load
**Nguyên nhân:** File JS/CSS không tồn tại
**Giải pháp:**
1. Kiểm tra `/vendor/virtual-select/` folder
2. Download từ: https://sa-si-dev.github.io/virtual-select/

#### 2. Flatpickr không hoạt động
**Nguyên nhân:** File JS/CSS không tồn tại
**Giải pháp:**
1. Kiểm tra `/vendor/flatpickr/` folder
2. Download từ: https://flatpickr.js.org/

#### 3. SweetAlert2 không hiển thị
**Nguyên nhân:** File JS không load
**Giải pháp:**
1. Kiểm tra `/js/sweetalert2@11.js`
2. Download từ CDN hoặc npm

### Lỗi Routes:

#### 1. 404 Not Found
**Nguyên nhân:** Routes chưa được thêm vào index.js
**Giải pháp:** Kiểm tra routes đã được thêm đúng cách

#### 2. 403 Forbidden
**Nguyên nhân:** Thiếu permissions
**Giải pháp:**
1. Thêm permissions vào user role
2. Kiểm tra middleware authentication/authorization

#### 3. 500 Internal Server Error
**Nguyên nhân:** Lỗi trong controller
**Giải pháp:**
1. Kiểm tra server logs
2. Debug từng bước trong controller

### Lỗi Views:

#### 1. Layout files not found
**Nguyên nhân:** Include sai path
**Giải pháp:** Đã được sửa để sử dụng layout đúng:
```html
<!-- Đúng -->
<%- include('../layout/head') %>
<%- include('../layout/header') %>
<%- include('../layout/sidebar') %>
<%- include('../layout/footer') %>
```

#### 2. CSS/JS không load
**Nguyên nhân:** Path không đúng
**Giải pháp:**
1. Kiểm tra public folder structure
2. Đảm bảo express.static được cấu hình đúng

## Tối ưu hóa

### Performance:
- Sử dụng DataTable server-side processing
- Cache Google Sheets API calls
- Optimize database queries với proper indexing

### Security:
- Input validation ở cả client và server
- SQL injection prevention
- XSS protection
- CSRF protection cho authenticated routes

### User Experience:
- Responsive design cho mobile
- Loading states cho các action
- Error handling với SweetAlert2
- Drag & drop interface cho field configuration
