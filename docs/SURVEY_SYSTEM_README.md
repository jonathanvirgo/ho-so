# 🔍 Hệ thống Quản lý Dự án và Khảo sát

Một hệ thống quản lý dự án và khảo sát trực tuyến hoàn chỉnh với tích hợp Google Sheets, được xây dựng trên Node.js và Express.

## ✨ Tính năng chính

### 📊 Quản lý Dự án
- ✅ Tạo, chỉnh sửa, xóa dự án
- ✅ Tự động tạo Google Sheet cho mỗi dự án
- ✅ Quản lý trạng thái dự án
- ✅ Phân quyền role-based access control

### 📝 Cấu hình Khảo sát
- ✅ Tạo nhiều khảo sát cho một dự án
- ✅ URL slug tùy chỉnh cho khảo sát công khai
- ✅ Cấu hình tùy chọn: multiple responses, required email
- ✅ Thông báo thành công tùy chỉnh

### 🎛️ Cấu hình Trường Khảo sát
- ✅ 10+ loại trường: text, textarea, select, multiselect, radio, checkbox, datetime, date, email, number
- ✅ Drag & drop để sắp xếp thứ tự
- ✅ Validation rules cho từng trường
- ✅ Tùy chọn bắt buộc/không bắt buộc

### 🌐 Form Khảo sát Công khai
- ✅ Giao diện responsive, mobile-friendly
- ✅ Virtual Select cho multiselect
- ✅ Flatpickr cho date/datetime picker
- ✅ Validation client & server-side
- ✅ Tự động lưu vào Google Sheets

### 📊 Quản lý Dữ liệu Khảo sát (Mới!)
- ✅ **SQLite backup tự động** cho mỗi project
- ✅ **Xem danh sách** phản hồi với DataTable
- ✅ **CRUD operations**: Xem, sửa, xóa responses
- ✅ **Thống kê** tổng quan và theo thời gian
- ✅ **Xuất Excel** với bộ lọc linh hoạt
- ✅ **Triple backup**: MySQL + Google Sheets + SQLite
- ✅ **Offline access** với SQLite database

## 🚀 Cài đặt nhanh

### 1. Database Setup
```sql
-- Chạy migration script
mysql -u username -p database_name < database/migrations/2025_08_19_survey_system.sql
```

### 2. Google Sheets API (Tùy chọn)
```bash
# Cài đặt dependencies (đã hoàn thành)
npm install googleapis google-auth-library sqlite3 exceljs

# Cấu hình environment variables (TÙY CHỌN)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ✅ Hệ thống hoạt động đầy đủ mà KHÔNG CẦN Google Sheets credentials
# 📊 Nếu có credentials -> Tự động sync với Google Sheets
# 💾 Nếu không có -> Chỉ lưu database (vẫn hoạt động bình thường)
```

### 3. Frontend Libraries
Các thư viện đã được tích hợp sẵn:
- Virtual Select (multiselect)
- Flatpickr (date/datetime picker)
- SweetAlert2 (notifications)
- jQuery UI (drag & drop)

## 📁 Cấu trúc Files

```
├── controllers/
│   ├── projectController.js          # Quản lý dự án
│   ├── surveyConfigController.js     # Cấu hình khảo sát
│   └── surveyController.js           # Form khảo sát công khai
├── services/
│   └── googleSheetsService.js        # Tích hợp Google Sheets
├── views/
│   ├── projects/                     # Views quản lý dự án
│   ├── survey-configs/               # Views cấu hình khảo sát
│   └── survey/                       # Views form công khai
├── public/
│   ├── css/survey-system.css         # Styles cho hệ thống
│   └── js/survey-system.js           # JavaScript cho hệ thống
├── database/migrations/
│   └── 2025_08_19_survey_system.sql  # Database schema
├── docs/
│   └── SURVEY_SYSTEM_GUIDE.md        # Hướng dẫn chi tiết
└── test/
    └── test-survey-system.js         # Test suite
```

## 🛣️ Routes chính

### Quản lý Dự án
```
GET    /projects                      # Danh sách dự án
GET    /projects/create               # Form tạo dự án
POST   /projects/create               # Tạo dự án mới
GET    /projects/:id/edit             # Form chỉnh sửa
POST   /projects/update               # Cập nhật dự án
POST   /projects/:id/delete           # Xóa dự án
```

### Quản lý Khảo sát
```
GET    /projects/:id/surveys          # Danh sách khảo sát
GET    /projects/:id/surveys/create   # Form tạo khảo sát
POST   /survey-configs/create         # Tạo cấu hình
GET    /survey-configs/:id/fields     # Cấu hình trường
POST   /survey-configs/save-fields    # Lưu cấu hình trường
```

### Quản lý Dữ liệu Khảo sát (Mới!)
```
GET    /projects/:projectId/survey-data              # Trang quản lý dữ liệu
POST   /projects/:projectId/survey-data/list         # API DataTable
GET    /projects/:projectId/survey-data/:responseId  # Chi tiết response
PUT    /projects/:projectId/survey-data/:responseId  # Cập nhật response
DELETE /projects/:projectId/survey-data/:responseId  # Xóa response
GET    /projects/:projectId/survey-data/export       # Xuất Excel
```

### Khảo sát Công khai
```
GET    /survey/:slug                  # Form khảo sát
POST   /survey/:slug/submit           # Submit khảo sát
```

## 🔐 Phân quyền

### Permissions cần thiết:
- `projects.read` - Xem dự án
- `projects.write` - Tạo/sửa dự án  
- `projects.delete` - Xóa dự án
- `survey-configs.read` - Xem khảo sát
- `survey-configs.write` - Tạo/sửa khảo sát
- `survey-configs.delete` - Xóa khảo sát

### Role filtering:
- User thường: chỉ thấy dự án của mình
- Admin: thấy tất cả dự án
- Campaign filtering: theo `campaign_id`

## 📊 Database Schema

### Bảng chính:
1. **projects** - Thông tin dự án
2. **survey_configs** - Cấu hình khảo sát
3. **survey_fields** - Các trường khảo sát
4. **survey_responses** - Phản hồi khảo sát
5. **survey_response_data** - Dữ liệu chi tiết
6. **survey_templates** - Template (tùy chọn)

## 🎨 Loại Trường hỗ trợ

| Loại | Mô tả | Tính năng |
|------|-------|-----------|
| **text** | Văn bản ngắn | Placeholder, validation |
| **textarea** | Văn bản dài | Rows tùy chỉnh |
| **email** | Email | Auto validation |
| **number** | Số | Min/max validation |
| **select** | Chọn một | Dropdown options |
| **multiselect** | Chọn nhiều | Virtual Select |
| **radio** | Radio buttons | Single choice |
| **checkbox** | Checkboxes | Multiple choice |
| **date** | Ngày | Flatpickr |
| **datetime** | Ngày + giờ | Flatpickr with time |

## 🧪 Testing

```bash
# Test Google Sheets service (kiểm tra API hoạt động)
node test/simple-sheets-test.js

# Test luồng đầy đủ
node test/survey-flow-test.js

# Test suite hoàn chỉnh
node test/test-survey-system.js
```

Test coverage:
- ✅ Project CRUD operations
- ✅ Survey configuration
- ✅ Field configuration
- ✅ Public form submission
- ✅ Validation testing
- ✅ Google Sheets integration (với/không credentials)
- ✅ Error handling graceful

## 📈 Google Sheets Integration

### Tự động:
- Tạo sheet mới cho mỗi dự án
- Cập nhật headers khi thay đổi fields
- Append dữ liệu real-time
- Backup trong database

### Cấu trúc Sheet:
```
ID | Email | IP Address | [Survey Fields] | Timestamp
```

## 🔧 Troubleshooting

### Google Sheets Issues:
1. ✅ Kiểm tra Service Account credentials
2. ✅ Enable Google Sheets API & Drive API
3. ✅ Verify Service Account permissions

### Frontend Issues:
1. ✅ Check Virtual Select loading
2. ✅ Verify Flatpickr initialization
3. ✅ Debug browser console

### Database Issues:
1. ✅ Run migration scripts
2. ✅ Check foreign key constraints
3. ✅ Verify user permissions

## 🚀 Deployment

### Production checklist:
- [ ] Database migration completed
- [ ] Google API credentials configured
- [ ] Environment variables set
- [ ] SSL certificates installed
- [ ] CDN configured for static assets
- [ ] Monitoring setup

## 📞 Support

Để được hỗ trợ:
1. Kiểm tra [SURVEY_SYSTEM_GUIDE.md](docs/SURVEY_SYSTEM_GUIDE.md)
2. Chạy test suite để verify setup
3. Check server logs cho error details

## 🎯 Roadmap

### Upcoming features:
- [ ] Survey analytics dashboard
- [ ] Export to Excel/PDF
- [ ] Email notifications
- [ ] Survey templates library
- [ ] Advanced conditional logic
- [ ] Multi-language support

---

**Phát triển bởi:** Augment Agent  
**Phiên bản:** 1.0.0  
**Ngày:** 2025-08-19
