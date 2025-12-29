# 📊 SQLite Backup & Data Management Feature

## 🎯 Tính năng đã triển khai

Hệ thống khảo sát giờ đây có thêm tính năng **SQLite backup** và **quản lý dữ liệu offline** hoàn chỉnh:

### ✅ **Tự động tạo SQLite Database**
- Khi tạo project mới → Tự động tạo file SQLite với tên: `{ProjectName}_{ProjectID}_{Date}.db`
- File được lưu trong thư mục: `storage/sqlite/`
- Database chứa đầy đủ cấu trúc bảng để lưu dữ liệu khảo sát

### ✅ **Tự động lưu dữ liệu**
- Khi user submit form khảo sát → Dữ liệu được lưu vào:
  1. **MySQL Database** (chính)
  2. **Google Sheets** (nếu có cấu hình)
  3. **SQLite Database** (backup offline)

### ✅ **Quản lý dữ liệu khảo sát**
- **Xem danh sách** phản hồi với DataTable
- **Xem chi tiết** từng phản hồi
- **Chỉnh sửa** phản hồi đã thu thập
- **Xóa** phản hồi không cần thiết
- **Thống kê** tổng quan (tổng số, theo ngày, thời gian)

### ✅ **Xuất Excel**
- Xuất toàn bộ dữ liệu ra file Excel
- Bộ lọc theo email, ngày tháng
- Headers tự động theo cấu hình fields
- Tên file tự động: `{ProjectName}_survey_data_{timestamp}.xlsx`

## 🏗️ Cấu trúc SQLite Database

### Bảng `survey_responses`
```sql
CREATE TABLE survey_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_config_id INTEGER,
    respondent_email TEXT,
    respondent_ip TEXT,
    user_agent TEXT,
    session_id TEXT,
    is_completed INTEGER DEFAULT 1,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Bảng `survey_response_data`
```sql
CREATE TABLE survey_response_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_response_id INTEGER,
    survey_field_id INTEGER,
    field_name TEXT,
    field_value TEXT,
    field_value_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_response_id) REFERENCES survey_responses(id)
);
```

### Bảng `project_info`
```sql
CREATE TABLE project_info (
    id INTEGER PRIMARY KEY,
    project_id INTEGER,
    project_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Cách sử dụng

### 1. Tạo Project mới
```
1. Truy cập /projects
2. Click "Tạo Dự án Mới"
3. Điền thông tin project
4. Submit → Hệ thống tự động tạo:
   - Record trong MySQL
   - Google Sheet (nếu có config)
   - SQLite Database file
```

### 2. Cấu hình và thu thập dữ liệu
```
1. Tạo khảo sát cho project
2. Cấu hình fields
3. Share link khảo sát công khai
4. User submit → Dữ liệu tự động lưu vào cả 3 nơi
```

### 3. Quản lý dữ liệu đã thu thập
```
1. Vào project → Click "Dữ liệu Khảo sát"
2. Xem thống kê tổng quan
3. Lọc và tìm kiếm dữ liệu
4. Xem/Sửa/Xóa từng phản hồi
5. Xuất Excel với bộ lọc
```

## 🔗 Routes mới

### Quản lý dữ liệu khảo sát
```
GET    /projects/:projectId/survey-data              # Trang quản lý dữ liệu
POST   /projects/:projectId/survey-data/list         # API DataTable
GET    /projects/:projectId/survey-data/:responseId  # Chi tiết response
PUT    /projects/:projectId/survey-data/:responseId  # Cập nhật response
DELETE /projects/:projectId/survey-data/:responseId  # Xóa response
GET    /projects/:projectId/survey-data/export       # Xuất Excel
```

## 📁 Files đã tạo/cập nhật

### Services
- **services/sqliteService.js** - Quản lý SQLite operations
  - `createProjectDatabase()` - Tạo database cho project
  - `saveSurveyResponse()` - Lưu response vào SQLite
  - `getSurveyResponses()` - Lấy danh sách responses
  - `getSurveyResponseDetail()` - Chi tiết response
  - `updateSurveyResponse()` - Cập nhật response
  - `deleteSurveyResponse()` - Xóa response
  - `exportToExcel()` - Xuất Excel
  - `getStatistics()` - Thống kê

### Controllers
- **controllers/surveyDataController.js** - Controller quản lý dữ liệu
  - `getList()` - Trang danh sách
  - `getListTable()` - API DataTable
  - `getDetail()` - Chi tiết response
  - `update()` - Cập nhật response
  - `delete()` - Xóa response
  - `exportExcel()` - Xuất Excel

### Views
- **views/survey-data/index.ejs** - Trang quản lý dữ liệu
  - Thống kê dashboard
  - Bộ lọc và tìm kiếm
  - DataTable với CRUD operations
  - Modal xem/sửa chi tiết

### Database
- **database/migrations/2025_08_19_survey_system.sql** - Thêm cột `sqlite_db_path`

### Updates
- **controllers/projectController.js** - Thêm tạo SQLite khi tạo project
- **controllers/surveyController.js** - Thêm lưu SQLite khi submit
- **routes/index.js** - Thêm routes quản lý dữ liệu
- **views/projects/edit.ejs** - Thêm link "Dữ liệu Khảo sát"

## 🔧 Dependencies mới

```bash
npm install sqlite3 exceljs
```

- **sqlite3** - SQLite database driver
- **exceljs** - Excel file generation

## 📊 Lợi ích

### 1. **Backup an toàn**
- Dữ liệu được lưu ở 3 nơi: MySQL + Google Sheets + SQLite
- SQLite file có thể copy, backup dễ dàng
- Không phụ thuộc internet để truy cập dữ liệu

### 2. **Quản lý linh hoạt**
- CRUD operations đầy đủ
- Tìm kiếm và lọc dữ liệu
- Thống kê real-time
- Export Excel với bộ lọc

### 3. **Performance tốt**
- SQLite rất nhanh cho read operations
- Không ảnh hưởng đến MySQL chính
- Có thể xử lý offline

### 4. **Tích hợp seamless**
- Tự động hoạt động, không cần config thêm
- Tương thích với flow hiện tại
- Graceful fallback nếu SQLite fail

## 🧪 Testing

```bash
# Test SQLite service
node test/simple-sqlite-test.js

# Test toàn bộ tính năng
node test/test-sqlite-feature.js
```

## 🔒 Security & Permissions

- Sử dụng cùng permission system: `survey-configs.read/write/delete`
- User chỉ thấy dữ liệu của project mình tạo
- Admin có thể truy cập tất cả
- SQLite files được lưu trong `storage/sqlite/` (ngoài web root)

## 📈 Monitoring

### File SQLite được tạo tại:
```
storage/sqlite/{ProjectName}_{ProjectID}_{Date}.db
```

### Logs để theo dõi:
```
✓ SQLite database created for project {ID}: {path}
✓ Survey response saved to SQLite: {path}
Warning: Could not create SQLite database: {error}
Warning: Could not save to SQLite: {error}
```

## 🎯 Next Steps

1. **Test với dữ liệu thực** - Tạo project và thu thập responses
2. **Backup strategy** - Định kỳ backup SQLite files
3. **Analytics** - Thêm charts và reports
4. **Import/Export** - Import từ Excel, export nhiều format
5. **Sync** - Đồng bộ giữa SQLite và MySQL nếu cần

---

**Kết luận:** Tính năng SQLite backup và quản lý dữ liệu đã được triển khai hoàn chỉnh, tự động hoạt động và tích hợp seamless với hệ thống hiện tại! 🎉
