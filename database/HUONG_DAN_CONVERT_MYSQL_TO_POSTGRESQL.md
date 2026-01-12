# Hướng Dẫn Chuyển Đổi MySQL sang PostgreSQL cho Supabase

## 📋 Mục lục
1. [Giới thiệu](#giới-thiệu)
2. [Các lỗi thường gặp](#các-lỗi-thường-gặp)
3. [Hướng dẫn sửa chữa](#hướng-dẫn-sửa-chữa)
4. [Script tự động](#script-tự-động)
5. [Kiểm tra và xác nhận](#kiểm-tra-và-xác-nhận)

---

## 🎯 Giới thiệu

Khi export database từ MySQL và muốn import vào PostgreSQL (Supabase), bạn sẽ gặp nhiều lỗi syntax vì MySQL và PostgreSQL có các quy ước khác nhau.

**File gốc:** MySQL export từ phpMyAdmin
**File đích:** PostgreSQL format tương thích Supabase

---

## ❌ Các lỗi thường gặp

### Lỗi 1: Backticks và Double Quotes
```sql
-- ❌ MySQL:
CREATE TABLE `brands` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
)

-- ✅ PostgreSQL:
CREATE TABLE "brands" (
  "id" SERIAL PRIMARY KEY
)
```

**Cách sửa:** Thay thế `` ` `` (backticks) bằng `"` (double quotes)

---

### Lỗi 2: Kiểu dữ liệu không tương thích

#### 2.1 Integer types
```sql
-- ❌ MySQL:
int(10) UNSIGNED
int(10)
int(11)
bigint(20) UNSIGNED
tinyint(1)
tinyint(3)

-- ✅ PostgreSQL:
integer
integer
integer
bigint
smallint
smallint
```

#### 2.2 String types
```sql
-- ❌ MySQL:
varchar(255)
longtext
mediumtext
enum('ACTIVE', 'DRAFT')

-- ✅ PostgreSQL:
varchar(255)  -- không đổi
text
text
varchar(255)  -- convert enum thành varchar
```

#### 2.3 Timestamp/Datetime
```sql
-- ❌ MySQL:
timestamp DEFAULT current_timestamp()
datetime DEFAULT now()
DEFAULT CURDATE()
ON UPDATE current_timestamp()

-- ✅ PostgreSQL:
timestamp DEFAULT CURRENT_TIMESTAMP
timestamp DEFAULT CURRENT_TIMESTAMP
date DEFAULT CURRENT_DATE
-- (Xóa ON UPDATE - PostgreSQL không hỗ trợ, dùng trigger nếu cần)
```

**Lưu ý:** PostgreSQL không có `ON UPDATE` clause. Nếu cần auto-update timestamp, dùng trigger.

#### 2.4 Numeric types
```sql
-- ❌ MySQL:
double(10,2)
float(10,2)
decimal(10,2) UNSIGNED

-- ✅ PostgreSQL:
numeric(10,2)
real
numeric(10,2)  -- Không có UNSIGNED
```

---

### Lỗi 3: MySQL-specific clauses
```sql
-- ❌ MySQL (XÓA HẾT):
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci
AUTO_INCREMENT=18

-- ✅ PostgreSQL:
-- (Xóa tất cả các dòng trên)
```

---

### Lỗi 4: Indexes và Constraints
```sql
-- ❌ MySQL:
ADD KEY `categories_parent_id_foreign` (`parent_id`)
ADD UNIQUE KEY `users_email_unique` (`email`)
ADD FOREIGN KEY ...

-- ✅ PostgreSQL:
-- (XÓA HẾT - không cần trong schema)
```

---

### Lỗi 5: MODIFY statements
```sql
-- ❌ MySQL:
MODIFY "id" integer NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

-- ✅ PostgreSQL:
-- (XÓA HẾT - đã định nghĩa trong CREATE TABLE)
```

---

### Lỗi 6: Duplicate PRIMARY KEY
```sql
-- ❌ MySQL:
CREATE TABLE "brands" ("id" SERIAL PRIMARY KEY, ...)
ALTER TABLE "brands" ADD PRIMARY KEY ("id");  -- LỖI!

-- ✅ PostgreSQL:
CREATE TABLE "brands" ("id" SERIAL PRIMARY KEY, ...)
-- (XÓA dòng ALTER TABLE ... ADD PRIMARY KEY)
```

---

### Lỗi 7: Type mismatch - Boolean vs Integer
```sql
-- ❌ PostgreSQL không chấp nhận:
"required" boolean NOT NULL DEFAULT false
VALUES: (1, 'id', 'number', 'ID', 1, 0, 0, ...)  -- 1, 0 là integer!

-- ✅ Giải pháp:
"required" smallint NOT NULL DEFAULT 0
VALUES: (1, 'id', 'number', 'ID', 1, 0, 0, ...)  -- Match type!
```

---

### Lỗi 8: Single quotes trong strings
```sql
-- ❌ PostgreSQL báo lỗi:
INSERT INTO "pages" VALUES (..., 'Cat o'nine tails', ...)

-- ✅ Escape single quotes:
INSERT INTO "pages" VALUES (..., 'Cat o''nine tails', ...)
```

---

### Lỗi 9: Backslash escape (\') không được chấp nhận
```sql
-- ❌ MySQL dùng backslash escape:
INSERT INTO "products" VALUES (..., 'Quần jean 32\'', ...)
INSERT INTO "users" VALUES (..., 'O\'Connor', ...)

-- ✅ PostgreSQL dùng double single quotes:
INSERT INTO "products" VALUES (..., 'Quần jean 32''', ...)
INSERT INTO "users" VALUES (..., 'O''Connor', ...)
```

**Lưu ý:** PostgreSQL **không chấp nhận** `\'` để escape single quote. Phải dùng `''` (hai dấu nháy đơn liên tiếp).

---

### Lỗi 10: Invalid date/datetime (0000-00-00)
```sql
-- ❌ MySQL chấp nhận nhưng PostgreSQL từ chối:
INSERT INTO "orders" VALUES (..., '0000-00-00 00:00:00', ...)
INSERT INTO "users" VALUES (..., '0000-00-00', ...)

-- ✅ PostgreSQL: Chuyển thành NULL
INSERT INTO "orders" VALUES (..., NULL, ...)
INSERT INTO "users" VALUES (..., NULL, ...)
```

**Lưu ý:** PostgreSQL không chấp nhận date `0000-00-00` vì không phải ngày hợp lệ. Phải chuyển thành `NULL` hoặc một ngày hợp lệ.

---

### Lỗi 11: BLOB/BINARY types
```sql
-- ❌ MySQL:
blob
tinyblob
mediumblob
longblob
binary(16)
varbinary(255)

-- ✅ PostgreSQL:
bytea
bytea
bytea
bytea
bytea
bytea
```

**Lưu ý:** PostgreSQL dùng `bytea` cho tất cả binary data. Nếu INSERT dữ liệu binary, cần encode dạng hex: `E'\\x...'` hoặc dùng `decode('...', 'hex')`.

---

### Lỗi 12: SET type (MySQL-only)
```sql
-- ❌ MySQL:
\"permissions\" SET('read','write','delete')

-- ✅ PostgreSQL (2 cách):
-- Cách 1: Dùng varchar
\"permissions\" varchar(255)

-- Cách 2: Dùng array (nếu cần query từng phần tử)
\"permissions\" text[]
```

**Lưu ý:** MySQL SET là kiểu độc quyền. PostgreSQL có thể dùng `varchar` hoặc `text[]` (array) tùy nhu cầu.

---

### Lỗi 13: IF NOT EXISTS / IF EXISTS syntax
```sql
-- ❌ MySQL:
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (...);

-- ✅ PostgreSQL:
DROP TABLE IF EXISTS \"users\";
CREATE TABLE IF NOT EXISTS \"users\" (...);
-- (Giữ nguyên, chỉ đổi backticks → double quotes)

-- ⚠️ Nhưng với VIEW:
DROP VIEW IF EXISTS `my_view`;
-- Có thể cần thêm CASCADE:
DROP VIEW IF EXISTS \"my_view\" CASCADE;
```

---

### Lỗi 14: Sequence reset sau khi import
```sql
-- ⚠️ Sau khi INSERT dữ liệu, SERIAL/sequence có thể bị sai:
INSERT INTO \"users\" (\"id\", \"name\") VALUES (100, 'Test User');
-- Sequence vẫn ở giá trị 1, lần INSERT tiếp theo sẽ conflict!

-- ✅ Reset sequence sau import:
SELECT setval('users_id_seq', (SELECT MAX(\"id\") FROM \"users\"));

-- Hoặc reset tất cả sequences:
SELECT setval(pg_get_serial_sequence('users', 'id'), 
       COALESCE((SELECT MAX(\"id\") FROM \"users\"), 1));
```

**Lưu ý:** Sau khi import data có ID cụ thể, **BẮT BUỘC** phải reset sequence để tránh lỗi duplicate key.

---

## 🔧 Hướng dẫn sửa chữa

### Bước 1: Thay thế Backticks bằng Double Quotes

```bash
sed -i 's/`/"/g' your_file.sql
```

---

### Bước 2: Xóa MySQL-specific clauses

```bash
# Xóa ENGINE, CHARSET, COLLATE
sed -i '/ENGINE=/d' your_file.sql
sed -i '/DEFAULT CHARSET/d' your_file.sql
sed -i '/COLLATE=/d' your_file.sql
sed -i '/AUTO_INCREMENT=/d' your_file.sql
```

---

### Bước 3: Chuyển đổi Data Types

Sử dụng script Python:

```python
import re

with open('your_file.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Integer types
content = re.sub(r'\bint\(\d+\)\s+UNSIGNED', 'integer', content, flags=re.IGNORECASE)
content = re.sub(r'\bint\(\d+\)', 'integer', content, flags=re.IGNORECASE)
content = re.sub(r'\bbigint\(\d+\)\s+UNSIGNED', 'bigint', content, flags=re.IGNORECASE)
content = re.sub(r'\btinyint\(\d+\)', 'smallint', content, flags=re.IGNORECASE)

# Text types
content = re.sub(r'\blongtext\b', 'text', content, flags=re.IGNORECASE)
content = re.sub(r'\bmediumtext\b', 'text', content, flags=re.IGNORECASE)
content = re.sub(r'\benum\([^)]*\)', "varchar(255)", content, flags=re.IGNORECASE)

# Timestamps
content = re.sub(r'\bcurrent_timestamp\(\)', 'CURRENT_TIMESTAMP', content, flags=re.IGNORECASE)
content = re.sub(r'\bnow\(\)', 'CURRENT_TIMESTAMP', content, flags=re.IGNORECASE)
content = re.sub(r'\bCURDATE\(\)', 'CURRENT_DATE', content, flags=re.IGNORECASE)

with open('your_file_fixed.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Done!")
```

---

### Bước 4: Xóa ADD KEY statements

```python
import re

with open('your_file.sql', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Xóa các dòng chứa ADD KEY, ADD UNIQUE KEY (nhưng giữ ADD PRIMARY KEY)
output_lines = [
    line for line in lines 
    if not ('ADD KEY' in line and 'ADD PRIMARY KEY' not in line)
    and not 'ADD UNIQUE KEY' in line
    and not 'ADD FOREIGN KEY' in line
]

with open('your_file_fixed.sql', 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print("✅ Done!")
```

---

### Bước 5: Xóa ALTER TABLE rỗng

```python
import re

with open('your_file.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Xóa ALTER TABLE rỗng
pattern = r'ALTER TABLE "[^"]+"\n\s*\n'
content = re.sub(pattern, '', content)

# Clean up extra blank lines
content = re.sub(r'\n\n\n+', '\n\n', content)

with open('your_file_fixed.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Done!")
```

---

### Bước 6: Xóa MODIFY statements

```python
import re

with open('your_file.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Xóa AUTO_INCREMENT section
pattern = r'--\s*AUTO_INCREMENT for dumped tables\s*--.*?(?=\n\n[^-]|\Z)'
content = re.sub(pattern, '', content, flags=re.DOTALL)

# Xóa MODIFY lines
content = re.sub(r'\s*MODIFY\s+"[^"]+"\s+integer NOT NULL AUTO_INCREMENT.*?\n', '', content)

with open('your_file_fixed.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Done!")
```

---

### Bước 7: Xóa Duplicate PRIMARY KEY

```python
import re

with open('your_file.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Xóa ALTER TABLE ... ADD PRIMARY KEY
pattern = r'ALTER TABLE "[^"]+"\n\s+ADD PRIMARY KEY \([^)]+\);'
content = re.sub(pattern, '', content)

# Clean up blank lines
content = re.sub(r'\n\n\n+', '\n\n', content)

with open('your_file_fixed.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Done!")
```

---

### Bước 8: Chuyển Boolean thành Smallint

```python
with open('your_file.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Thay thế boolean columns
replacements = [
    ('  "required" boolean NOT NULL DEFAULT false,', '  "required" smallint NOT NULL DEFAULT 0,'),
    ('  "browse" boolean NOT NULL DEFAULT true,', '  "browse" smallint NOT NULL DEFAULT 1,'),
    ('  "read" boolean NOT NULL DEFAULT true,', '  "read" smallint NOT NULL DEFAULT 1,'),
    ('  "edit" boolean NOT NULL DEFAULT true,', '  "edit" smallint NOT NULL DEFAULT 1,'),
    ('  "add" boolean NOT NULL DEFAULT true,', '  "add" smallint NOT NULL DEFAULT 1,'),
    ('  "delete" boolean NOT NULL DEFAULT true,', '  "delete" smallint NOT NULL DEFAULT 1,'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('your_file_fixed.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Done!")
```

---

### Bước 9: Escape Single Quotes

```python
with open('your_file.sql', 'r', encoding='utf-8') as f:
    lines = f.readlines()

output_lines = []
for line in lines:
    if line.strip().startswith('(') and 'VALUES' in lines[max(0, lines.index(line)-1)]:
        # Đây là dòng INSERT VALUES
        result = []
        in_string = False
        i = 0
        while i < len(line):
            char = line[i]
            if char == "'":
                if in_string and i + 1 < len(line) and line[i + 1] == "'":
                    # Đã escaped rồi
                    result.append("''")
                    i += 2
                    continue
                else:
                    # Toggle string state
                    in_string = not in_string
                    result.append("'")
            else:
                result.append(char)
            i += 1
        output_lines.append(''.join(result))
    else:
        output_lines.append(line)

with open('your_file_fixed.sql', 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print("✅ Done!")
```

---

### Bước 10: Chuyển Backslash Escape (\') thành Double Quotes ('')

```python
import re

with open('your_file.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Thay thế \' thành ''
content = content.replace("\\'", "''")

with open('your_file_fixed.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Done!")
```

---

### Bước 11: Chuyển Invalid Date/Datetime thành NULL

```python
import re

with open('your_file.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Chuyển datetime '0000-00-00 00:00:00' hoặc các biến thể thành NULL
content = re.sub(r"'0000-00-00 00:00:00'", 'NULL', content)
content = re.sub(r"'0000-00-00'", 'NULL', content)

# Hoặc pattern tổng quát hơn cho các ngày không hợp lệ
# Bao gồm '00-00-00', '0000-00-00', v.v.
content = re.sub(r"'00-00-00 00:00:00'", 'NULL', content)
content = re.sub(r"'00-00-00'", 'NULL', content)

with open('your_file_fixed.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Done!")
```

---

### Bước 12: Chuyển BLOB/BINARY types thành BYTEA

```python
import re

with open('your_file.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Chuyển tất cả blob types → bytea
content = re.sub(r'\blongblob\b', 'bytea', content, flags=re.IGNORECASE)
content = re.sub(r'\bmediumblob\b', 'bytea', content, flags=re.IGNORECASE)
content = re.sub(r'\btinyblob\b', 'bytea', content, flags=re.IGNORECASE)
content = re.sub(r'\bblob\b', 'bytea', content, flags=re.IGNORECASE)
content = re.sub(r'\bbinary\(\d+\)', 'bytea', content, flags=re.IGNORECASE)
content = re.sub(r'\bvarbinary\(\d+\)', 'bytea', content, flags=re.IGNORECASE)

with open('your_file_fixed.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Done!")
```

---

### Bước 13: Chuyển SET type thành VARCHAR

```python
import re

with open('your_file.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Chuyển SET type → varchar(255)
content = re.sub(r'\bSET\([^)]*\)', 'varchar(255)', content, flags=re.IGNORECASE)

with open('your_file_fixed.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Done!")
```

---

### Bước 14: Xóa ON UPDATE clause

```python
import re

with open('your_file.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Xóa ON UPDATE current_timestamp() hoặc các biến thể
content = re.sub(r'\s+ON UPDATE\s+current_timestamp\(\)', '', content, flags=re.IGNORECASE)
content = re.sub(r'\s+ON UPDATE\s+CURRENT_TIMESTAMP', '', content, flags=re.IGNORECASE)

with open('your_file_fixed.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Done!")
```

---

## 🤖 Script tự động

Kết hợp tất cả các bước trên:

```python
#!/usr/bin/env python3
import re
import sys

def convert_mysql_to_postgresql(input_file, output_file):
    print(f"📖 Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("🔄 Converting...")
    
    # 1. Backticks → Double quotes
    content = content.replace('`', '"')
    print("  ✓ Backticks converted")
    
    # 2. Data types
    content = re.sub(r'\bint\(\d+\)\s+UNSIGNED', 'integer', content, flags=re.IGNORECASE)
    content = re.sub(r'\bint\(\d+\)', 'integer', content, flags=re.IGNORECASE)
    content = re.sub(r'\bbigint\(\d+\)\s+UNSIGNED', 'bigint', content, flags=re.IGNORECASE)
    content = re.sub(r'\btinyint\(\d+\)', 'smallint', content, flags=re.IGNORECASE)
    content = re.sub(r'\blongtext\b', 'text', content, flags=re.IGNORECASE)
    content = re.sub(r'\bmediumtext\b', 'text', content, flags=re.IGNORECASE)
    content = re.sub(r'\benum\([^)]*\)', "varchar(255)", content, flags=re.IGNORECASE)
    print("  ✓ Data types converted")
    
    # 3. MySQL clauses
    content = re.sub(r'\s*ENGINE=.*?\n', '\n', content, flags=re.IGNORECASE)
    content = re.sub(r'\s*DEFAULT CHARSET=.*?\n', '\n', content, flags=re.IGNORECASE)
    content = re.sub(r'\s*COLLATE=.*?\n', '\n', content, flags=re.IGNORECASE)
    print("  ✓ MySQL clauses removed")
    
    # 4. Functions
    content = re.sub(r'\bcurrent_timestamp\(\)', 'CURRENT_TIMESTAMP', content, flags=re.IGNORECASE)
    content = re.sub(r'\bnow\(\)', 'CURRENT_TIMESTAMP', content, flags=re.IGNORECASE)
    content = re.sub(r'\bCURDATE\(\)', 'CURRENT_DATE', content, flags=re.IGNORECASE)
    print("  ✓ Functions converted")
    
    # 4.5 Invalid dates → NULL
    content = re.sub(r"'0000-00-00 00:00:00'", 'NULL', content)
    content = re.sub(r"'0000-00-00'", 'NULL', content)
    content = re.sub(r"'00-00-00 00:00:00'", 'NULL', content)
    content = re.sub(r"'00-00-00'", 'NULL', content)
    print("  ✓ Invalid dates converted to NULL")
    
    # 4.6 Backslash escape → Double quotes
    content = content.replace("\\'", "''")
    print("  ✓ Backslash escapes converted")
    
    # 4.7 BLOB/BINARY → bytea
    content = re.sub(r'\blongblob\b', 'bytea', content, flags=re.IGNORECASE)
    content = re.sub(r'\bmediumblob\b', 'bytea', content, flags=re.IGNORECASE)
    content = re.sub(r'\btinyblob\b', 'bytea', content, flags=re.IGNORECASE)
    content = re.sub(r'\bblob\b', 'bytea', content, flags=re.IGNORECASE)
    content = re.sub(r'\bbinary\(\d+\)', 'bytea', content, flags=re.IGNORECASE)
    content = re.sub(r'\bvarbinary\(\d+\)', 'bytea', content, flags=re.IGNORECASE)
    print("  ✓ BLOB/BINARY converted to bytea")
    
    # 4.8 SET type → varchar
    content = re.sub(r'\bSET\([^)]*\)', 'varchar(255)', content, flags=re.IGNORECASE)
    print("  ✓ SET type converted to varchar")
    
    # 4.9 ON UPDATE clause (remove - PostgreSQL không hỗ trợ)
    content = re.sub(r'\s+ON UPDATE\s+current_timestamp\(\)', '', content, flags=re.IGNORECASE)
    content = re.sub(r'\s+ON UPDATE\s+CURRENT_TIMESTAMP', '', content, flags=re.IGNORECASE)
    print("  ✓ ON UPDATE clause removed")
    
    # 4.10 DOUBLE/FLOAT types
    content = re.sub(r'\bdouble\(\d+,\d+\)', 'numeric', content, flags=re.IGNORECASE)
    content = re.sub(r'\bdouble\b', 'double precision', content, flags=re.IGNORECASE)
    content = re.sub(r'\bfloat\(\d+,\d+\)', 'real', content, flags=re.IGNORECASE)
    content = re.sub(r'\bfloat\b', 'real', content, flags=re.IGNORECASE)
    print("  ✓ DOUBLE/FLOAT converted")
    
    # 5. Remove ADD KEY/UNIQUE KEY/FOREIGN KEY
    lines = content.split('\n')
    lines = [l for l in lines if not any(x in l for x in [
        'ADD KEY', 'ADD UNIQUE KEY', 'ADD FOREIGN KEY'
    ]) or 'ADD PRIMARY KEY' in l]
    content = '\n'.join(lines)
    print("  ✓ KEY statements removed")
    
    # 6. Remove ALTER TABLE ... ADD PRIMARY KEY
    pattern = r'ALTER TABLE "[^"]+"\n\s+ADD PRIMARY KEY \([^)]+\);'
    content = re.sub(pattern, '', content)
    print("  ✓ Duplicate PRIMARY KEYs removed")
    
    # 7. Boolean → Smallint
    replacements = [
        ('  "required" boolean NOT NULL DEFAULT false,', '  "required" smallint NOT NULL DEFAULT 0,'),
        ('  "browse" boolean NOT NULL DEFAULT true,', '  "browse" smallint NOT NULL DEFAULT 1,'),
        ('  "read" boolean NOT NULL DEFAULT true,', '  "read" smallint NOT NULL DEFAULT 1,'),
        ('  "edit" boolean NOT NULL DEFAULT true,', '  "edit" smallint NOT NULL DEFAULT 1,'),
        ('  "add" boolean NOT NULL DEFAULT true,', '  "add" smallint NOT NULL DEFAULT 1,'),
        ('  "delete" boolean NOT NULL DEFAULT true,', '  "delete" smallint NOT NULL DEFAULT 1,'),
        ('  "generate_permissions" boolean NOT NULL DEFAULT false,', '  "generate_permissions" smallint NOT NULL DEFAULT 0,'),
        ('  "featured" boolean NOT NULL DEFAULT false,', '  "featured" smallint NOT NULL DEFAULT 0,'),
    ]
    for old, new in replacements:
        content = content.replace(old, new)
    print("  ✓ Boolean converted to smallint")
    
    # 8. Clean up blank lines
    content = re.sub(r'\n\n\n+', '\n\n', content)
    
    print(f"💾 Writing {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Done! File ready for import.")
    print("")
    print("⚠️  QUAN TRỌNG: Sau khi import, nhớ chạy reset sequence!")
    print("    Xem phần 'Reset Sequences sau Import' trong tài liệu.")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 convert.py input.sql [output.sql]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file.replace('.sql', '_postgresql.sql')
    
    convert_mysql_to_postgresql(input_file, output_file)
```

**Cách sử dụng:**
```bash
python3 convert.py original.sql
# Output: original_postgresql.sql
```

---

## ✅ Kiểm tra và xác nhận

### 1. Kiểm tra Backticks
```bash
grep -c '`' your_file.sql
# Kết quả: 0 (không có backticks)
```

### 2. Kiểm tra MySQL Keywords
```bash
grep -E '(ENGINE|CHARSET|COLLATE|AUTO_INCREMENT)' your_file.sql
# Kết quả: (không có output)
```

### 3. Kiểm tra Quote Pairing
```python
with open('your_file.sql', 'r') as f:
    for i, line in enumerate(f, 1):
        if line.strip().startswith('('):
            count = line.count("'") - line.count("''") * 2
            if count % 2 != 0:
                print(f"Line {i}: Odd quotes")
```

### 4. Import vào Supabase
1. Mở Supabase Dashboard
2. Vào **SQL Editor**
3. Click **New Query**
4. Copy toàn bộ nội dung file PostgreSQL
5. Paste vào editor
6. Click **Run**
7. Chờ import hoàn tất (thường 2-5 phút)

---

## 🚨 Troubleshooting

### Lỗi: "syntax error at or near..."
- Kiểm tra lại quote escaping
- Kiểm tra brackets và parentheses
- Kiểm tra có dòng trống bất thường không
- **Kiểm tra `\'` - đổi thành `''`**

### Lỗi: "column ... is of type X but expression is of type Y"
- Kiểm tra type mismatch trong INSERT VALUES
- Đảm bảo tất cả boolean đã convert thành smallint

### Lỗi: "multiple primary keys for table..."
- Kiểm tra có bị thêm PRIMARY KEY hai lần không
- Xóa `ALTER TABLE ... ADD PRIMARY KEY` nếu có

### Lỗi: "date/time field value out of range" hoặc "invalid input syntax for type date/timestamp"
- **Kiểm tra có ngày `'0000-00-00'` hoặc `'0000-00-00 00:00:00'` không**
- Chuyển các giá trị này thành `NULL`
- MySQL cho phép `0000-00-00` nhưng PostgreSQL không

### Lỗi: "unterminated quoted string" hoặc "syntax error at or near 'và'"
- **Kiểm tra `\'` backslash escape - PostgreSQL không chấp nhận**
- Thay tất cả `\'` thành `''`
- Kiểm tra single quotes chưa được escape đúng cách

### Import chậm
- File quá lớn, Supabase cần thời gian xử lý
- Nếu import timeout, có thể split file thành nhỏ hơn

### Lỗi: "duplicate key value violates unique constraint"
- **Sequence chưa được reset sau import!**
- Phải chạy reset sequence cho tất cả bảng có SERIAL/AUTO_INCREMENT
- Xem phần "Reset Sequences sau Import" bên dưới

### Lỗi: "type ... does not exist"
- **Có thể có SET type hoặc ENUM chưa được convert**
- Chuyển SET → varchar(255)
- Chuyển ENUM → varchar(255)

---

## 🔄 Reset Sequences sau Import

**QUAN TRỌNG:** Sau khi import dữ liệu có ID cụ thể, SERIAL sequence vẫn bắt đầu từ 1. Khi INSERT mới sẽ bị lỗi duplicate key!

### Cách 1: Reset từng sequence thủ công
```sql
-- Thay 'users' bằng tên bảng, 'id' bằng tên cột
SELECT setval('users_id_seq', (SELECT COALESCE(MAX("id"), 1) FROM "users"));
SELECT setval('products_id_seq', (SELECT COALESCE(MAX("id"), 1) FROM "products"));
-- ... các bảng khác
```

### Cách 2: Script Python tạo lệnh reset tự động
```python
#!/usr/bin/env python3
import re

# Đọc file SQL để tìm tất cả các bảng có SERIAL
with open('your_file.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Tìm tất cả CREATE TABLE với SERIAL
pattern = r'CREATE TABLE "(\w+)".*?"(\w+)"\s+SERIAL'
matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)

print("-- Reset sequences script")
print("-- Chạy sau khi import dữ liệu")
print("")

for table_name, column_name in matches:
    seq_name = f"{table_name}_{column_name}_seq"
    print(f'SELECT setval(\'{seq_name}\', (SELECT COALESCE(MAX("{column_name}"), 1) FROM "{table_name}"));')

# Hoặc cách tổng quát hơn (reset tất cả sequences trong database):
print("")
print("-- Hoặc dùng query động (chạy trong psql):")
print("""
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT c.table_name, c.column_name 
              FROM information_schema.columns c
              WHERE c.column_default LIKE 'nextval%'
              AND c.table_schema = 'public') LOOP
        EXECUTE format('SELECT setval(pg_get_serial_sequence(''%I'', ''%I''), COALESCE(MAX("%I"), 1)) FROM "%I"',
                       r.table_name, r.column_name, r.column_name, r.table_name);
    END LOOP;
END $$;
""")
```

### Cách 3: Query reset tất cả sequences (chạy trực tiếp trong PostgreSQL)
```sql
-- Chạy trong Supabase SQL Editor hoặc psql
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT c.table_name, c.column_name 
        FROM information_schema.columns c
        WHERE c.column_default LIKE 'nextval%'
        AND c.table_schema = 'public'
    ) LOOP
        EXECUTE format(
            'SELECT setval(pg_get_serial_sequence(''%I'', ''%I''), COALESCE((SELECT MAX("%I") FROM "%I"), 1))',
            r.table_name, r.column_name, r.column_name, r.table_name
        );
    END LOOP;
END $$;
```

---

## 📚 Tài liệu tham khảo

- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [Supabase SQL Editor](https://app.supabase.com)
- [MySQL to PostgreSQL Conversion](https://wiki.postgresql.org/wiki/PostgreSQL_vs_MySQL)

---

## 💡 Tips & Tricks

1. **Backup trước khi chỉnh sửa**
   ```bash
   cp original.sql original.sql.backup
   ```

2. **Test trên file nhỏ trước**
   - Tách 1-2 bảng để test trước
   - Sau đó áp dụng cho toàn bộ file

3. **Sử dụng `sed` cho thay thế nhanh**
   ```bash
   sed -i 's/old/new/g' file.sql
   ```

4. **Kiểm tra file size**
   ```bash
   ls -lh file.sql
   ```

---

**Tác giả:** GitHub Copilot  
**Ngày cập nhật:** 2026-01-10  
**Phiên bản:** 1.2

### Changelog:
- **v1.2** (2026-01-10): Thêm lỗi 11-14 (BLOB/BINARY, SET, IF NOT EXISTS, Sequence reset), Reset Sequences sau Import, DOUBLE/FLOAT types, ON UPDATE clause
- **v1.1** (2026-01-10): Thêm lỗi 9-10 (Backslash escape, Invalid date)
- **v1.0** (2025-12-30): Phiên bản đầu tiên
