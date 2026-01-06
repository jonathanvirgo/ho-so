# PostgreSQL SQL Compatibility Issues - Chi Tiết & Giải Pháp

## 🔴 Issue #1: LIMIT Clause Hard-coded (CRITICAL)

### Vị trí
`/home/qd/project/benh-nhan/services/commonService.js` - line 1362

### Code hiện tại
```javascript
sqlData += ` LIMIT ${start}, ${length}`;  // ❌ Only works for MySQL
```

### Vấn đề
- MySQL LIMIT: `LIMIT offset, count`
- PostgreSQL LIMIT: `LIMIT count OFFSET offset`
- Converter sẽ xử lý nó, nhưng:
  1. Conversion phụ thuộc vào regex match
  2. Nếu có tham số (?), việc convert sẽ không work vì parameter indices thay đổi
  3. Best practice là generate SQL syntax đúng từ đầu

### Giải pháp
Tạo helper function hoặc adjust converter để xử lý numbered parameters.

---

## 🟠 Issue #2: DATEDIFF() Function Usage (HIGH PRIORITY)

### Vị trí & Count
1. `services/inventoryService.js` - **5 lần sử dụng**
   - Line 34: `DATEDIFF(s.expiry_date, CURDATE())`
   - Line 37: `DATEDIFF(s.expiry_date, CURDATE())`
   - Line 80: `DATEDIFF(MIN(s.expiry_date), CURDATE())`
   - Line 255: `DATEDIFF(s.expiry_date, CURDATE())`
   - Line 261: `DATEDIFF(s.expiry_date, CURDATE())`

### Vấn đề
- MySQL: `DATEDIFF(expr1, expr2)` = số ngày giữa 2 dates
- PostgreSQL: **Không có hàm DATEDIFF()**
- Cần convert thành: `(expr1::date - expr2::date)` hoặc `EXTRACT(DAY FROM expr1 - expr2)`

### Code Convert Hiện Tại
```javascript
// services/commonService.js line 163
newSql = newSql.replace(/DATEDIFF\s*\(([^,]+),\s*([^)]+)\)/gi, 
    '($1::date - $2::date)');
```

### Kết quả Convert
```javascript
// Input MySQL
DATEDIFF(s.expiry_date, CURDATE())

// Output PostgreSQL (sau regex)
(s.expiry_date::date - CURRENT_DATE::date)

// (CURRENT_DATE đã được convert từ CURDATE() trước đó)
```

### Status
✅ Converter hoạt động NHƯNG:
- Phải đảm bảo `CURDATE()` được convert thành `CURRENT_DATE` **trước** DATEDIFF convert
- Hiện tại line 164 convert `CURDATE()` **sau** line 163, cần đảo ngược thứ tự

---

## 🟠 Issue #3: Converter Order Problem

### Code hiện tại (sai thứ tự)
```javascript
// Line 160-164 trong convertSqlToPostgres()
newSql = newSql.replace(/DATEDIFF\s*\(([^,]+),\s*([^)]+)\)/gi, '($1::date - $2::date)');
// ...
newSql = newSql.replace(/CURDATE\(\)/gi, 'CURRENT_DATE');
newSql = newSql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');
```

### Vấn đề
Khi convert `DATEDIFF(s.expiry_date, CURDATE())`:
1. Regex match: `DATEDIFF\s*\(([^,]+),\s*([^)]+)\)` capture:
   - Group 1: `s.expiry_date`
   - Group 2: `CURDATE()`
2. Replace thành: `(s.expiry_date::date - CURDATE()::date)`
3. **Sau đó** CURDATE() được replace thành CURRENT_DATE

### Kết quả (tuy nhiên đúng)
```javascript
(s.expiry_date::date - CURRENT_DATE::date)  // ✅ Đúng
```

**Kết luận:** Thứ tự hiện tại OK nhưng nên explicit về intent

---

## 🟡 Issue #4: Backticks vs Double Quotes (MEDIUM)

### Vị trí
Multiple places trong `commonService.js` khi build INSERT/UPDATE/DELETE

### Code MySQL (hiện tại)
```javascript
// Line 217
sql += '`' + i + '`';

// Line 231-232
sql += i + ' = ?';
// Nên là:
sql += '`' + i + '`' + ' = ?';
```

### Code PostgreSQL
```javascript
// Line 172-175
sql += '"' + i + '"';
```

### Status
✅ Có check `db.getDbType() === 'postgres'` nhưng:
- Không phải tất cả place đều có check
- Backticks **có thể** không bị lỗi trong PostgreSQL (treated as identifier)
- Tuy nhiên best practice là dùng double quotes cho PostgreSQL

### Ví dụ Vấn đề
```javascript
// MySQL - OK
INSERT INTO `users` (`id`, `name`) VALUES (?, ?)

// PostgreSQL - OK nhưng không idiomatic
INSERT INTO `users` (`id`, `name`) VALUES (?, ?)

// PostgreSQL - Best practice
INSERT INTO "users" ("id", "name") VALUES ($1, $2)
```

---

## 🟡 Issue #5: Parameter Placeholder ($ vs ?)

### Vị trí
Throughout `commonService.js`

### Tình trạng
```javascript
// MySQL dùng: ?
connection.query(sql, paramSql, callback)

// PostgreSQL dùng: $1, $2, $3, ...
pool.query(sql, paramSql, callback)
```

### Code Handle
```javascript
// Line 150-155
let newSql = sql;
let pIdx = 1;
if (sql.includes('?')) {
    const parts = newSql.split('?');
    newSql = parts.reduce((acc, part, i) => {
        if (i === parts.length - 1) return acc + part;
        return acc + part + '$' + (pIdx++);
    }, '');
}
```

### Status
✅ Tốt - Converter xử lý được

---

## 🟡 Issue #6: GROUP BY Strictness (MEDIUM)

### Vị trí
`services/inventoryService.js` line 54-56

### Code
```javascript
SELECT 
    s.food_id,
    f.name as food_name,
    COUNT(DISTINCT s.batch_code) as batch_count,
FROM inventory_stock s
GROUP BY s.food_id, f.name, f.code, f.edible, f.price, s.unit
```

### Vấn đề
- MySQL (default mode): Cho phép GROUP BY chỉ với `s.food_id`
- PostgreSQL: **Strict** - yêu cầu tất cả non-aggregated columns phải trong GROUP BY

### Status
✅ Code hiện tại **đã tuân thủ** - tất cả non-agg columns đều trong GROUP BY

---

## ❌ Issue #7: Chưa Kiểm Tra - JSON Fields

### Vị trí
Database schema cho `users` table với `role_id JSON`

### Vấn đề
- MySQL: `role_id JSON` - lưu trữ array
- PostgreSQL: `role_id JSONB` - tối ưu hơn nhưng syntax access khác

### Cần làm
Kiểm tra trong `userController.js`, `userService.js` xem cách truy cập JSON field

---

## ❌ Issue #8: Chưa Kiểm Tra - Auto Increment

### Vị trí
Database schema migrations

### Vấn đề
- MySQL: `AUTO_INCREMENT` keyword
- PostgreSQL: `SERIAL` hoặc `GENERATED ALWAYS AS IDENTITY`

### Ví dụ
```sql
-- MySQL
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ...
);

-- PostgreSQL
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    -- hoặc
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ...
);
```

### Status
⚠️ Cần kiểm tra file `database/*.sql` và `database/migrations/`

---

## 📊 Conversion Test Cases

### Test 1: DATEDIFF + CURDATE
```javascript
// Input MySQL
SELECT DATEDIFF(expiry_date, CURDATE()) as days_left FROM stock;

// Expected PostgreSQL
SELECT (expiry_date::date - CURRENT_DATE::date) as days_left FROM stock;

// Test (nên chạy)
const sql = "SELECT DATEDIFF(expiry_date, CURDATE()) as days_left FROM stock";
const converted = mainService.convertSqlToPostgres(sql, []);
console.log(converted.sql);
// Should output: SELECT (expiry_date::date - CURRENT_DATE::date) as days_left FROM stock
```

### Test 2: LIMIT Clause
```javascript
// Input MySQL
SELECT * FROM users LIMIT 10, 20;

// Expected PostgreSQL
SELECT * FROM users LIMIT 20 OFFSET 10;

// Test
const sql = "SELECT * FROM users LIMIT 10, 20";
const converted = mainService.convertSqlToPostgres(sql, []);
console.log(converted.sql);
// Should output: SELECT * FROM users LIMIT 20 OFFSET 10
```

### Test 3: Backticks
```javascript
// Input MySQL
SELECT `id`, `name` FROM `users` WHERE `active` = 1;

// Expected PostgreSQL (double quotes)
SELECT "id", "name" FROM "users" WHERE "active" = 1;
// But also acceptable:
SELECT id, name FROM users WHERE active = 1;
```

---

## 🔧 Recommended Fix Order

### Phase 1: Urgent (Ngay lập tức)
1. ✅ Verify DATEDIFF converter works correctly
2. ⚠️ Fix LIMIT clause hard-coding
3. ⚠️ Add comprehensive SQL conversion tests

### Phase 2: Important (Trong tuần)
4. Check tất cả JSON field usage
5. Verify auto-increment handling
6. Test toàn bộ với PostgreSQL

### Phase 3: Polish (Optional)
7. Improve backtick -> quote conversion
8. Add query logging/debugging for DB issues
9. Create database migration tool

