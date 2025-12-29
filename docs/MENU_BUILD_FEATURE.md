# 🍽️ Tính năng Xây dựng Thực đơn (Menu Build)

## 📋 Tổng quan

Tính năng **Menu Build** cho phép xây dựng và quản lý thực đơn theo tuần hoặc theo tháng với các loại món ăn khác nhau. Đây là một công cụ mạnh mẽ giúp lập kế hoạch bữa ăn một cách khoa học và có hệ thống.

## ✨ Tính năng chính

### 1. Quản lý Thực đơn
- ✅ Tạo thực đơn mới
- ✅ Chỉnh sửa thực đơn
- ✅ Xóa thực đơn (soft delete)
- ✅ Xem danh sách thực đơn với DataTable
- ✅ Tìm kiếm và lọc thực đơn

### 2. Loại hiển thị linh hoạt
- ✅ **Theo tuần**: Hiển thị 1 tuần (7 ngày)
- ✅ **Theo tháng**: Hiển thị 4 tuần (28 ngày)
- ✅ Chọn tuần cụ thể khi xem theo tuần

### 3. Quản lý Loại món
- ✅ 6 loại món mặc định:
  - Món chính
  - Món mặn
  - Món canh
  - Món xào
  - Món luộc
  - Món rau
- ✅ Bật/tắt hiển thị từng loại món
- ✅ Sắp xếp thứ tự hiển thị

### 4. Xây dựng Thực đơn
- ✅ Chọn món cho từng ngày trong tuần
- ✅ Chọn món cho từng loại món
- ✅ Tìm kiếm món ăn nhanh với Select2
- ✅ Hiển thị dạng bảng trực quan

### 5. Trạng thái Thực đơn
- ✅ **Nháp** (Draft): Đang soạn thảo
- ✅ **Đang dùng** (Active): Đang áp dụng
- ✅ **Lưu trữ** (Archived): Đã hoàn thành

### 6. Phân quyền
- ✅ User thường chỉ thấy thực đơn của mình
- ✅ Admin thấy tất cả thực đơn
- ✅ Kiểm soát quyền tạo/sửa/xóa

## 🗄️ Cấu trúc Database

### Bảng `dish_categories`
Lưu trữ các loại món ăn (món chính, món mặn, v.v.)

### Bảng `menu_builds`
Lưu trữ thông tin thực đơn (tên, loại hiển thị, trạng thái, v.v.)

### Bảng `menu_build_details`
Lưu trữ chi tiết món ăn cho từng ngày và loại món

### View `v_menu_build_details`
View tổng hợp để query dễ dàng

## 📁 Cấu trúc File

```
benh-nhan/
├── controllers/
│   └── menuBuildController.js          # Controller xử lý logic
├── routes/
│   └── index.js                        # Routes cho menu build
├── views/
│   └── menu-build/
│       ├── index.ejs                   # Trang danh sách
│       └── form.ejs                    # Trang tạo/sửa
├── public/
│   ├── css/
│   │   └── menu-build.css              # CSS riêng
│   └── js/
│       └── menu-build.js               # JavaScript riêng
├── database/
│   ├── migrations/
│   │   └── 2025_10_06_create_menu_build_tables.sql
│   └── seeds/
│       └── menu_build_demo_data.sql    # Dữ liệu demo
├── test/
│   └── test-menu-build.js              # Test suite
└── docs/
    └── MENU_BUILD_GUIDE.md             # Hướng dẫn chi tiết
```

## 🚀 Cài đặt

### 1. Chạy Migration

```bash
mysql -u root -p patients < database/migrations/2025_10_06_create_menu_build_tables.sql
```

### 2. (Tùy chọn) Import dữ liệu demo

```bash
mysql -u root -p patients < database/seeds/menu_build_demo_data.sql
```

### 3. Chạy Test

```bash
node test/test-menu-build.js
```

Kết quả mong đợi:
```
✅ Passed:   9
❌ Failed:   0
⚠️  Warnings: 0
💥 Errors:   0
📝 Total:    9

🎉 All tests passed! Menu Build feature is ready to use.
```

## 🎯 Cách sử dụng

### Truy cập tính năng

1. Đăng nhập vào hệ thống
2. Từ trang chủ, click vào card **"Thực đơn"**
3. Hoặc truy cập: `http://localhost:4000/menu-build`

### Tạo thực đơn mới

1. Click nút **"Tạo thực đơn mới"**
2. Điền thông tin:
   - Tên thực đơn (bắt buộc)
   - Mô tả
   - Loại hiển thị: Theo tuần hoặc Cả tháng
   - Trạng thái
   - Ngày bắt đầu/kết thúc
3. Chọn loại món muốn hiển thị
4. Chọn món cho từng ngày và loại món
5. Click **"Lưu thực đơn"**

### Chỉnh sửa thực đơn

1. Từ danh sách, click nút **"Chỉnh sửa"** (icon bút)
2. Thay đổi thông tin cần thiết
3. Click **"Lưu thực đơn"**

### Xóa thực đơn

1. Từ danh sách, click nút **"Xóa"** (icon thùng rác)
2. Xác nhận xóa
3. Thực đơn sẽ bị xóa mềm (có thể khôi phục)

## 🔌 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/menu-build` | Trang danh sách |
| POST | `/menu-build/list` | Lấy dữ liệu DataTable |
| GET | `/menu-build/create` | Trang tạo mới |
| GET | `/menu-build/edit/:id` | Trang chỉnh sửa |
| POST | `/menu-build/save` | Lưu thực đơn |
| POST | `/menu-build/delete/:id` | Xóa thực đơn |
| GET | `/api/menu-build/dish-categories` | Lấy danh sách loại món |
| POST | `/api/menu-build/toggle-category/:id` | Bật/tắt loại món |

## 🎨 Giao diện

### Trang danh sách
- DataTable với tìm kiếm, sắp xếp, phân trang
- Hiển thị: ID, Tên, Loại hiển thị, Trạng thái, Ngày, Số món, Người tạo
- Nút Tạo mới, Chỉnh sửa, Xóa

### Trang tạo/sửa
- Form thông tin thực đơn
- Buttons chọn loại món hiển thị
- Bảng thực đơn theo tuần/tháng
- Select2 cho chọn món ăn
- Nút Lưu và Quay lại

## 🔐 Bảo mật

- ✅ Xác thực JWT
- ✅ Kiểm tra quyền truy cập
- ✅ Validate dữ liệu đầu vào
- ✅ SQL injection prevention
- ✅ XSS protection

## 📱 Responsive

- ✅ Desktop: Hiển thị đầy đủ
- ✅ Tablet: Thu gọn một số cột
- ✅ Mobile: Hiển thị dạng card, scroll ngang

## 🧪 Testing

Test suite bao gồm:
- ✅ Kiểm tra bảng database
- ✅ Kiểm tra loại món
- ✅ Kiểm tra view
- ✅ Kiểm tra foreign keys
- ✅ Kiểm tra indexes
- ✅ Kiểm tra unique constraints
- ✅ Kiểm tra dữ liệu mẫu

## 📊 Thống kê

- **Số bảng database**: 3 bảng + 1 view
- **Số routes**: 8 endpoints
- **Số loại món mặc định**: 6 loại
- **Số ngày trong tuần**: 7 ngày
- **Số tuần trong tháng**: 4 tuần
- **Tổng số ô trong bảng tháng**: 168 ô (4 tuần × 7 ngày × 6 loại món)

## 🎯 Roadmap

Các tính năng có thể phát triển thêm:

- [ ] Export thực đơn ra PDF
- [ ] Copy thực đơn từ tuần này sang tuần khác
- [ ] Template thực đơn có sẵn
- [ ] Tính toán dinh dưỡng tự động
- [ ] Gợi ý món ăn bằng AI
- [ ] In thực đơn
- [ ] Chia sẻ thực đơn
- [ ] Lịch sử thay đổi
- [ ] Comments/Notes cho từng món
- [ ] Quản lý nguyên liệu

## 📚 Tài liệu tham khảo

- [Hướng dẫn chi tiết](./docs/MENU_BUILD_GUIDE.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Controllers Structure](./docs/CONTROLLERS_STRUCTURE.md)
- [Routes Structure](./docs/ROUTES_STRUCTURE.md)

## 🐛 Báo lỗi

Nếu gặp lỗi, vui lòng:
1. Kiểm tra console log
2. Kiểm tra database connection
3. Chạy test suite
4. Liên hệ team phát triển

## 👥 Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng:
1. Fork repository
2. Tạo branch mới
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📝 License

Copyright © 2025 - Hệ thống Quản lý Bệnh nhân

---

**Phát triển bởi**: AI Assistant
**Ngày tạo**: 2025-10-06
**Phiên bản**: 1.0.0

