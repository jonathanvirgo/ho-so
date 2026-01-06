# PostgreSQL Compatibility Report

## 📋 Tóm tắt Báo cáo
Dự án hiện sử dụng cả **MySQL** và **PostgreSQL**, nhưng cấu trúc SQL có **những vấn đề tương thích** cần được xử lý. Hệ thống đã có một số cơ chế chuyển đổi SQL cơ bản, nhưng chưa hoàn chỉnh.

**Trạng thái:** ⚠️ **Có vấn đề tương thích** - Cần sửa chữa

---

## 🔴 Vấn Đề Tìm Thấy

### 1. **LIMIT Clause - MySQ vs PostgreSQL** ✅ Đã được xử lý
**Vị trí:** `services/commonService.js` line 173  
**Vấn đề:** MySQL sử dụng `LIMIT offset, count` nhưng PostgreSQL cần `LIMIT count OFFSET offset`

**Tình trạng:**
```javascript
// ✅ Đã được xử lý trong convertSqlToPostgres()
const limitRegex = /LIMIT\s+(\d+)\s*,\s*(\d+)/i;
const match = newSql.match(limitRegex);
if (match) {
    newSql = newSql.replace(limitRegex, `LIMIT ${match[2]} OFFSET ${match[1]}`);
}
```

**Tuy nhiên:** Vấn đề là `commonService.js` line 1362 vẫn sử dụng **hard-coded LIMIT**:
```javascript
sqlData += ` LIMIT ${start}, ${length}`;  // ❌ MySQL syntax
```

Khi truyền cho `getListTable()` nó sẽ được convert qua PostgreSQL, nhưng cách này không bảo mảo.

---

### 2. **DATEDIFF() Function** ⚠️ Được xử lý một phần
**Vị trí:** 
- `services/inventoryService.js` lines 34, 37, 80, 255, 261
- `services/commonService.js` line 163

**Vấn đề:** MySQL dùng `DATEDIFF(date1, date2)` trả về số ngày, PostgreSQL không có hàm này.

**Tình trạng:**
```javascript
// ❌ Hiện tại trong inventoryService.js
sql = `... DATEDIFF(s.expiry_date, CURDATE()) as days_to_expiry ...`

// ✅ Đã có convert trong commonService.js line 163
newSql = newSql.replace(/DATEDIFF\s*\(([^,]+),\s*([^)]+)\)/gi, 
    '($1::date - $2::date)');
```

**Vấn đề:** Conversion chỉ phù hợp cho `DATEDIFF(date1, date2)` thành `(date1::date - date2::date)`. 
Tuy nhiên:
- PostgreSQL casting là `($1::date - $2::date)` trả về `integer` (đúng)
- Nhưng cần đảm bảo tất cả DATEDIFF() đều đi qua `getListTable()`

---

### 3. **Backticks (`) vs Double Quotes (\")** ✅ Được xử lý
**Vị trí:** Multiple places trong SQL queries

**Tình trạng:**
```javascript
// ❌ MySQL style
sql += '`' + i + '`';

// ✅ PostgreSQL style được xử lý trong line 155
newSql = newSql.replace(/`/g, '"');
```

---

### 4. **CURRENT_TIMESTAMP vs CURDATE()** ✅ Được xử lý
**Vị trí:** `services/commonService.js` lines 162, 164

**Tình trạng:**
```javascript
// ✅ Đã được xử lý
newSql = newSql.replace(/CURDATE\(\)/gi, 'CURRENT_DATE');
newSql = newSql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');
```

---

### 5. **Bổ sung - CASE WHEN Expressions** ⚠️ Cần kiểm tra
**Vị trí:** `services/inventoryService.js` lines 35-38, 78-81, 68-72

**Vấn đề:** SQL CASE WHEN có thể khác biệt trong cách xử lý NULL

```javascript
CASE 
    WHEN s.expiry_date < CURDATE() THEN 'expired'
    WHEN DATEDIFF(s.expiry_date, CURDATE()) <= 7 THEN 'warning'
    ELSE 'ok'
END as expiry_status
```

**Status:** Cấu trúc CASE WHEN cơ bản thì tương thích cả MySQL và PostgreSQL, nhưng DATEDIFF() cần được convert.

---

## ⚠️ Vấn Đề Tiềm Ẩn

### 6. **AUTO_INCREMENT vs SERIAL/IDENTITY**
**Vị trí:** Database schema files (`database/*.sql`)

**Tình trạng:** Chưa kiểm tra migration files chi tiết, nhưng schema cần:
- MySQL: `AUTO_INCREMENT`
- PostgreSQL: `SERIAL` hoặc `GENERATED ALWAYS AS IDENTITY`

---

### 7. **GROUP BY Clause Differences**
**Vị trí:** `services/inventoryService.js` line 54

```javascript
GROUP BY s.food_id, f.name, f.code, f.edible, f.price, s.unit
```

**Issue:** PostgreSQL có yêu cầu strict GROUP BY - tất cả non-aggregated columns phải trong GROUP BY.
- MySQL cho phép GROUP BY chỉ với column đầu tiên
- Status: ✅ Code trên đã tuân thủ

---

### 8. **Array Operations (JSON Fields)**
**Vị trí:** Cần kiểm tra user table với `role_id JSON`

**Tình trạng:** Chưa rõ cách xử lý, cần kiểm tra thêm

---

## 🔧 Khuyến Nghị Sửa Chữa

### Priority 1: Critical
1. **Fix LIMIT clause generation** - Không hard-code LIMIT syntax trong SQL builder
   - Tạo helper function: `buildLimitClause(start, length, dbType)`
   
2. **Audit tất cả DATEDIFF() uses** - Đảm bảo chúng đều đi qua converter

### Priority 2: Important
3. **Test toàn bộ SQL queries** - Chạy test suite với cả MySQL và PostgreSQL
4. **Database migration files** - Tách riêng MySQL và PostgreSQL schema files
5. **JSON/Array field handling** - Xác định cách xử lý `role_id` JSON field

### Priority 3: Nice to have
6. **Performance optimization** - Thêm query logging/tracing để debug
7. **Add database compatibility layer** - Tạo utility functions cho các differences
8. **Documentation** - Cập nhật DEVELOPER_GUIDE với PostgreSQL-specific notes

---

## 📝 Files Cần Xem Xét

```
services/
  ├── commonService.js         ✅ Đã có converter cơ bản
  ├── inventoryService.js      ⚠️ Sử dụng DATEDIFF() nhiều lần
  └── [other services]         ⚠️ Cần kiểm tra

controllers/
  ├── dishController.js        ✅ Sử dụng parameterized queries
  └── [other controllers]      ✅ Hầu hết tốt

database/
  ├── *.sql                    ❌ Chỉ cho MySQL
  └── migrations/              ⚠️ Cần tách MySQL/PostgreSQL versions
```

---

## ✅ Điểm Tích Cực

1. **Database abstraction layer** - Tốt: `db.getDbType()` được sử dụng
2. **SQL conversion function** - Tốt: `convertSqlToPostgres()` exists
3. **Parameterized queries** - Tốt: Dùng `?` placeholders và arrays
4. **Connection pooling** - Tốt: Cả MySQL `mysql2/promise` và `pg` Pool

---

## 🎯 Next Steps

1. Chạy test toàn bộ với PostgreSQL để phát hiện issues
2. Fix LIMIT clause issue đầu tiên
3. Audit và fix tất cả DATEDIFF() usages
4. Tạo test cases để kiểm tra tương thích
5. Cập nhật documentation

