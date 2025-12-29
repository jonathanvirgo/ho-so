# DataTable Order Configuration Guide

## Tổng quan

Hướng dẫn này mô tả cách cấu hình DataTables để xử lý order parameters từ frontend và sử dụng order mặc định khi không có order từ request.

## Các thay đổi chính

### 1. Helper Function trong CommonService

Đã thêm function `parseDataTableOrder` trong `services/commonService.js`:

```javascript
/**
 * Parse order parameters từ DataTables request body
 * @param {Object} reqBody - Request body từ DataTables
 * @param {Array} columnsMapping - Mapping giữa column index và column name
 * @param {Array} defaultOrder - Order mặc định nếu không có order từ request
 * @returns {Array} - Array các order objects
 */
parseDataTableOrder: function(reqBody, columnsMapping, defaultOrder = []) {
    let orderFromRequest = [];
    
    if (reqBody['order[0][column]'] !== undefined) {
        let orderIndex = 0;
        while (reqBody[`order[${orderIndex}][column]`] !== undefined) {
            const columnIndex = parseInt(reqBody[`order[${orderIndex}][column]`]);
            const direction = reqBody[`order[${orderIndex}][dir]`] || 'asc';
            
            // Chỉ thêm order nếu column index hợp lệ và có mapping
            if (columnIndex >= 0 && columnIndex < columnsMapping.length && columnsMapping[columnIndex]) {
                orderFromRequest.push({
                    column: columnsMapping[columnIndex],
                    dir: direction.toUpperCase()
                });
            }
            orderIndex++;
        }
    }
    
    // Sử dụng order từ request nếu có, nếu không thì dùng order mặc định
    return orderFromRequest.length > 0 ? orderFromRequest : defaultOrder;
}
```

### 2. Cập nhật Controller

Ví dụ trong `controllers/patientController.js`:

```javascript
// Định nghĩa columns mapping cho DataTables
const columnsMapping = [
    '', // column 0 - actions column (không sort được)
    'fullname', // column 1
    'phone', // column 2  
    'phong_dieu_tri', // column 3
    'ngay_hoi_chan', // column 4
    'chuan_doan' // column 5
];

// Order mặc định
const defaultOrder = [
    {
        column: 'khan_cap', // khẩn cấp đầu tiên
        dir: 'DESC'
    },
    {
        column: 'ngay_hoi_chan', // ngày hội chẩn thứ hai
        dir: 'DESC'
    },
    {
        column: 'id', // id cuối cùng
        dir: 'DESC'
    }
];

// Parse order từ req.body sử dụng helper function
const finalOrder = commonService.parseDataTableOrder(req.body, columnsMapping, defaultOrder);

var parameter = {
    // ... other parameters
    order: finalOrder,
    // ... other parameters
};
```

### 3. Cập nhật Frontend Views

Thêm cấu hình `orderable` và `searchable` cho từng column:

```javascript
columns: [
    {
        data: null,
        orderable: false, // Không cho phép sort cột actions
        searchable: false, // Không search trong cột actions
        render: function (data, type, row) {
            // render actions
        }
    },
    { 
        data: 'fullname',
        orderable: true, // Cho phép sort
        searchable: true // Cho phép search
    },
    { 
        data: 'phone',
        orderable: true,
        searchable: true
    },
    // ... other columns
],
// Cấu hình order mặc định (sẽ được override bởi server nếu có)
order: [], // Để trống để server xử lý order
// Cấu hình searching
searching: true, // Bật tính năng search
// Cấu hình ordering
ordering: true // Bật tính năng sort
```

## Cách sử dụng

### Bước 1: Định nghĩa columns mapping

Tạo array mapping giữa column index (từ DataTables) và column name (trong database):

```javascript
const columnsMapping = [
    '', // column 0 - thường là actions column
    'column_name_1', // column 1
    'column_name_2', // column 2
    // ...
];
```

### Bước 2: Định nghĩa order mặc định

```javascript
const defaultOrder = [
    {
        column: 'priority_column',
        dir: 'DESC'
    },
    {
        column: 'secondary_column',
        dir: 'ASC'
    }
];
```

### Bước 3: Sử dụng helper function

```javascript
const finalOrder = commonService.parseDataTableOrder(req.body, columnsMapping, defaultOrder);
```

### Bước 4: Cập nhật frontend

Thêm cấu hình `orderable`, `searchable`, `ordering`, và `searching` trong DataTables initialization.

## Lợi ích

1. **Tự động xử lý order từ frontend**: Hệ thống tự động parse và validate order parameters từ DataTables
2. **Order mặc định**: Khi không có order từ frontend, sử dụng order mặc định đã định nghĩa
3. **Bảo mật**: Validate column index và chỉ cho phép sort các column được định nghĩa
4. **Linh hoạt**: Có thể bật/tắt sort và search cho từng column riêng biệt
5. **Tái sử dụng**: Helper function có thể được sử dụng cho tất cả các controller

## Ví dụ req.body từ DataTables

```javascript
{
  draw: '2',
  'columns[0][data]': '',
  'columns[0][orderable]': 'false',
  'columns[0][searchable]': 'false',
  'columns[1][data]': 'fullname',
  'columns[1][orderable]': 'true',
  'columns[1][searchable]': 'true',
  'order[0][column]': '2',
  'order[0][dir]': 'asc',
  length: '25',
  'search[value]': '',
  path: 'hoi-chan'
}
```

Với cấu hình này, hệ thống sẽ:
- Parse order từ `order[0][column]` = 2 (tương ứng với `phone` trong columnsMapping)
- Sử dụng direction từ `order[0][dir]` = 'asc'
- Tạo order object: `{column: 'phone', dir: 'ASC'}`
