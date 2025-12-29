# Hướng dẫn Responsive Table - Mobile Card Layout

## Tổng quan

Hệ thống responsive table tự động chuyển đổi các bảng HTML thành layout card trên mobile devices (màn hình < 768px). Điều này giúp cải thiện trải nghiệm người dùng khi xem dữ liệu trên điện thoại.

## Cách hoạt động

### Desktop (≥ 768px)
- Hiển thị bảng thông thường với các cột và hàng
- Sử dụng DataTables với đầy đủ tính năng

### Mobile (< 768px)
- Mỗi hàng (row) chuyển thành một card
- Mỗi ô (cell) hiển thị với label tương ứng
- Buttons action được căn giữa và có spacing phù hợp

## Files đã được cập nhật

### 1. CSS Files
- `public/css/table-config.css` - Thêm responsive styles
- Media queries cho mobile layout
- Card styling và button adjustments

### 2. JavaScript Files
- `public/js/responsive-table.js` - Utility tự động thêm data-label
- Tự động detect table headers và thêm attributes
- Observer cho dynamic content (DataTables)

### 3. Layout Files
- `views/layout/footer.ejs` - Include responsive-table.js

## Cách sử dụng

### Tự động (Recommended)
Hệ thống sẽ tự động áp dụng cho tất cả tables có class `table`:

```html
<div class="table-responsive">
    <table class="table table-bordered" id="dataTable">
        <thead>
            <tr>
                <th>Thao tác</th>
                <th>Họ tên</th>
                <th>Số điện thoại</th>
                <th>Chẩn đoán</th>
            </tr>
        </thead>
        <tbody>
            <!-- Data rows -->
        </tbody>
    </table>
</div>
```

### Manual Setup (Nếu cần)
```javascript
// Refresh specific table
responsiveTable.refreshTable('dataTable');

// Process new table
const table = document.getElementById('myTable');
responsiveTable.processTable(table);
```

## Customization

### Custom Labels
Để tùy chỉnh labels cho các columns cụ thể, thêm CSS:

```css
.table-responsive table.table tbody td[data-label="Custom Column"]:before {
    content: "Nhãn tùy chỉnh";
}
```

### Card Styling
Tùy chỉnh appearance của cards:

```css
@media (max-width: 768px) {
    .table-responsive table.table tbody tr {
        /* Custom card styles */
        background: #f8f9fc;
        border-radius: 12px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
}
```

## Testing

### Browser DevTools
1. Mở Developer Tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Chọn mobile device hoặc set width < 768px
4. Refresh page để xem responsive layout

### Real Device Testing
- Test trên điện thoại thực tế
- Kiểm tra touch interactions
- Verify button sizes và spacing

## Troubleshooting

### Labels không hiển thị
- Kiểm tra table có đúng structure (thead/tbody)
- Verify responsive-table.js đã được load
- Check console cho errors

### Styling issues
- Kiểm tra table-config.css đã được include
- Verify media queries hoạt động
- Check CSS conflicts

### DataTables integration
- Ensure DataTables initialized sau khi DOM ready
- Check draw.dt event handler
- Verify table ID matches

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes

- CSS transforms chỉ áp dụng trên mobile
- JavaScript observer chỉ active khi cần thiết
- Minimal impact trên desktop performance

## Examples

### Basic Patient List
```html
<table class="table table-bordered" id="patientTable">
    <thead>
        <tr>
            <th>Thao tác</th>
            <th>Họ tên</th>
            <th>Số điện thoại</th>
            <th>Chẩn đoán</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <div class="d-flex gap-2">
                    <a class="btn btn-info btn-sm btn-circle" href="/edit/1">
                        <i class="fas fa-pen-square"></i>
                    </a>
                    <button class="btn btn-danger btn-sm btn-circle">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
            <td>Nguyễn Văn A</td>
            <td><a href="tel:0123456789">0123456789</a></td>
            <td>Viêm gan B</td>
        </tr>
    </tbody>
</table>
```

### DataTables Integration
```javascript
$('#patientTable').DataTable({
    responsive: true,
    // ... other options
});
```

## Future Enhancements

- [ ] Swipe gestures cho mobile
- [ ] Collapsible card sections
- [ ] Custom card templates
- [ ] Advanced filtering on mobile
- [ ] Export functionality for mobile
