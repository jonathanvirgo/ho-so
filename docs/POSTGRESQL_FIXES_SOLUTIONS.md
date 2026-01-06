# PostgreSQL Compatibility - Fixes & Solutions

## 🔧 Fix #1: LIMIT Clause Hard-coding (CRITICAL)

### Problem
```javascript
// ❌ Current code in commonService.js:1362
sqlData += ` LIMIT ${start}, ${length}`;  // Only MySQL syntax
```

### Solution

**Option A: Conditional in getDataTableWithFilter (Recommended)**
```javascript
// In services/commonService.js around line 1362
if (db.getDbType() === 'postgres') {
    sqlData += ` LIMIT ${length} OFFSET ${start}`;
} else {
    sqlData += ` LIMIT ${start}, ${length}`;
}
```

**Option B: Create helper function (Better for reusability)**
```javascript
// Add to commonService.js
const buildLimitClause = (start, length, dbType) => {
    if (dbType === 'postgres') {
        return ` LIMIT ${length} OFFSET ${start}`;
    } else {
        return ` LIMIT ${start}, ${length}`;
    }
};

// Usage
sqlData += buildLimitClause(start, length, db.getDbType());
```

### Test
```javascript
// Test file: tests/sql-conversion.test.js
const assert = require('assert');

test('LIMIT clause generation', () => {
    const mysqlLimit = buildLimitClause(10, 20, 'mysql');
    assert.strictEqual(mysqlLimit, ' LIMIT 10, 20');
    
    const pgLimit = buildLimitClause(10, 20, 'postgres');
    assert.strictEqual(pgLimit, ' LIMIT 20 OFFSET 10');
});
```

---

## 🔧 Fix #2: Converter Order Clarification (HIGH)

### Problem
DATEDIFF converter runs before CURDATE converter - but it works by accident because regex capture groups are replaced AFTER pattern match.

### Current Code (Actually OK, but confusing)
```javascript
// Line 163 - Captures CURDATE() in group 2
newSql = newSql.replace(/DATEDIFF\s*\(([^,]+),\s*([^)]+)\)/gi, 
    '($1::date - $2::date)');

// Line 164 - Replaces CURDATE() in the entire string AFTER regex
newSql = newSql.replace(/CURDATE\(\)/gi, 'CURRENT_DATE');
```

**Example:**
```
Input:  DATEDIFF(expiry_date, CURDATE())
Step 1: (expiry_date::date - CURDATE()::date)     [Captured CURDATE()]
Step 2: (expiry_date::date - CURRENT_DATE::date)  [Replaced CURDATE]
Output: ✅ Correct
```

### Improved Solution (More Explicit)
```javascript
// In services/commonService.js, order replacements logically
convertSqlToPostgres: function (sql, paramSql) {
    let newSql = sql;
    let newParams = [...paramSql];
    let pIdx = 1;
    
    // STEP 1: Replace placeholders (?) with ($1, $2, ...)
    if (sql.includes('?')) {
        const parts = newSql.split('?');
        newSql = parts.reduce((acc, part, i) => {
            if (i === parts.length - 1) return acc + part;
            return acc + part + '$' + (pIdx++);
        }, '');
    }
    
    // STEP 2: Replace backticks with double quotes
    newSql = newSql.replace(/`/g, '"');
    
    // STEP 3: Replace base date/time functions FIRST
    newSql = newSql.replace(/CURDATE\(\)/gi, 'CURRENT_DATE');
    newSql = newSql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');
    
    // STEP 4: Replace complex functions that use results from STEP 3
    // DATEDIFF now has CURRENT_DATE available
    newSql = newSql.replace(/DATEDIFF\s*\(([^,]+),\s*([^)]+)\)/gi, 
        '($1::date - $2::date)');
    
    // STEP 5: Replace LIMIT syntax
    const limitRegex = /LIMIT\s+(\d+)\s*,\s*(\d+)/i;
    const match = newSql.match(limitRegex);
    if (match) {
        newSql = newSql.replace(limitRegex, `LIMIT ${match[2]} OFFSET ${match[1]}`);
    }
    
    return { sql: newSql, params: newParams };
}
```

### Test Cases
```javascript
// tests/sql-conversion.test.js
test('DATEDIFF conversion with CURDATE', () => {
    const sql = 'SELECT DATEDIFF(expiry_date, CURDATE()) FROM stock';
    const result = mainService.convertSqlToPostgres(sql, []);
    assert(result.sql.includes('CURRENT_DATE'));
    assert(!result.sql.includes('CURDATE'));
    assert(!result.sql.includes('DATEDIFF'));
    // Should output: SELECT (expiry_date::date - CURRENT_DATE::date) FROM stock
});

test('DATEDIFF conversion with multiple occurrences', () => {
    const sql = `
        SELECT 
            DATEDIFF(date1, CURDATE()) as days1,
            DATEDIFF(date2, date3) as days2
        FROM table1
    `;
    const result = mainService.convertSqlToPostgres(sql, []);
    // Both DATEDIFF should be converted
    assert(!result.sql.includes('DATEDIFF'));
});

test('Complex query with LIMIT and DATEDIFF', () => {
    const sql = `
        SELECT * FROM stock 
        WHERE DATEDIFF(expiry_date, CURDATE()) > 0 
        LIMIT 10, 20
    `;
    const result = mainService.convertSqlToPostgres(sql, []);
    assert(result.sql.includes('LIMIT 20 OFFSET 10'));
    assert(result.sql.includes('CURRENT_DATE'));
});
```

---

## 🔧 Fix #3: AUTO_INCREMENT Migration Strategy (HIGH)

### Problem
All `.sql` files use MySQL `AUTO_INCREMENT` syntax. PostgreSQL needs `SERIAL` or `GENERATED ALWAYS AS IDENTITY`.

### Solution A: Separate Migration Files

**Create folder structure:**
```
database/
├── migrations/           (MySQL migrations)
│   ├── 2025_08_10_viem_gan_mt1.sql
│   └── ...
├── migrations-postgresql/   (NEW - PostgreSQL migrations)
│   ├── 2025_08_10_viem_gan_mt1.sql
│   └── ...
└── init-db.js           (NEW - Init script)
```

**Example conversion:**
```sql
-- MySQL version: database/migrations/2025_08_10_viem_gan_mt1.sql
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PostgreSQL version: database/migrations-postgresql/2025_08_10_viem_gan_mt1.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Migration runner script:**
```javascript
// database/init-db.js
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigrations() {
    const dbType = process.env.DB_TYPE || 'mysql';
    const migrationsDir = dbType === 'postgres' 
        ? 'migrations-postgresql'
        : 'migrations';
    
    const migrationsPath = path.join(__dirname, migrationsDir);
    const files = fs.readdirSync(migrationsPath)
        .filter(f => f.endsWith('.sql'))
        .sort();
    
    for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
        
        try {
            if (dbType === 'postgres') {
                await db.get().query(sql);
            } else {
                await new Promise((resolve, reject) => {
                    db.get().query(sql, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            }
            console.log(`✓ Executed ${file}`);
        } catch (error) {
            console.error(`✗ Failed ${file}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = { runMigrations };
```

### Solution B: Dynamic SQL Conversion (Alternative)

If you want single migration files, use a converter:

```javascript
// database/sql-converter.js
function convertMySQLToPG(sqlScript) {
    let pgSql = sqlScript;
    
    // Convert AUTO_INCREMENT to SERIAL
    pgSql = pgSql.replace(
        /(\`?id\`?)\s+INT\s+NOT\s+NULL\s+AUTO_INCREMENT/gi,
        '$1 SERIAL'
    );
    
    // Remove AUTO_INCREMENT from table definitions
    pgSql = pgSql.replace(/AUTO_INCREMENT=\d+\s*/gi, '');
    
    // Convert ENGINE=InnoDB to nothing (PostgreSQL doesn't need it)
    pgSql = pgSql.replace(/\s+ENGINE=InnoDB/gi, '');
    
    // Convert CHARSET and COLLATION
    pgSql = pgSql.replace(/\s+DEFAULT\s+CHARSET=[^\s;]*/gi, '');
    pgSql = pgSql.replace(/\s+COLLATE=[^\s;]*/gi, '');
    
    // Convert ON UPDATE CURRENT_TIMESTAMP (not standard in PG)
    // Would need trigger
    pgSql = pgSql.replace(/\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, '');
    
    return pgSql;
}

module.exports = { convertMySQLToPG };
```

**Usage:**
```javascript
// In init-db.js
if (dbType === 'postgres') {
    const converted = convertMySQLToPG(sql);
    await db.get().query(converted);
} else {
    await db.get().query(sql);
}
```

---

## 🔧 Fix #4: ENUM Type Handling (MEDIUM)

### Problem
```sql
-- MySQL
`issue_type` enum('menu','manual','waste','return') DEFAULT 'manual'

-- PostgreSQL doesn't have direct ENUM in CREATE TABLE
-- Need separate ENUM type or VARCHAR with CHECK
```

### Solution A: Use VARCHAR with CHECK (Simple, Compatible)
```sql
-- Works for both MySQL and PostgreSQL
`issue_type` VARCHAR(20) DEFAULT 'manual' 
    CHECK (issue_type IN ('menu', 'manual', 'waste', 'return'))
```

### Solution B: PostgreSQL ENUM Types (Better for PG)
```sql
-- PostgreSQL only migration
CREATE TYPE issue_type_enum AS ENUM ('menu', 'manual', 'waste', 'return');

CREATE TABLE inventory_issues (
    id SERIAL PRIMARY KEY,
    issue_type issue_type_enum DEFAULT 'manual',
    ...
);
```

**With migration runner:**
```javascript
if (dbType === 'postgres') {
    // Create ENUM types first
    await db.get().query(`
        CREATE TYPE IF NOT EXISTS issue_type_enum AS ENUM 
            ('menu', 'manual', 'waste', 'return')
    `);
} else {
    // MySQL just uses ENUM directly
}
```

---

## 🧪 Complete Test File Example

```javascript
// tests/sql-conversion.test.js
const assert = require('assert');
const db = require('../config/db');
const mainService = require('../services/commonService');

describe('SQL Conversion - MySQL to PostgreSQL', () => {
    
    describe('LIMIT Clause', () => {
        test('Should convert LIMIT offset,count to LIMIT count OFFSET offset', () => {
            const sql = 'SELECT * FROM users LIMIT 10, 20';
            const result = mainService.convertSqlToPostgres(sql, []);
            assert(result.sql.includes('LIMIT 20 OFFSET 10'));
        });
        
        test('Should handle multiple LIMIT clauses', () => {
            // If multiple LIMIT (edge case)
            const sql = 'SELECT * FROM users LIMIT 0, 10 UNION SELECT * FROM posts LIMIT 0, 5';
            const result = mainService.convertSqlToPostgres(sql, []);
            assert(result.sql.match(/LIMIT.*OFFSET/g).length >= 2);
        });
    });
    
    describe('DATEDIFF Function', () => {
        test('Should convert DATEDIFF(date1, date2)', () => {
            const sql = 'SELECT DATEDIFF(expiry_date, curdate())';
            const result = mainService.convertSqlToPostgres(sql, []);
            assert(result.sql.includes('::date'));
            assert(!result.sql.includes('DATEDIFF'));
        });
        
        test('Should handle DATEDIFF with column names', () => {
            const sql = 'SELECT DATEDIFF(table1.date1, table2.date2) FROM table1';
            const result = mainService.convertSqlToPostgres(sql, []);
            assert(result.sql.includes('::date'));
        });
    });
    
    describe('Date Functions', () => {
        test('Should convert CURDATE() to CURRENT_DATE', () => {
            const sql = 'SELECT * FROM stock WHERE expiry_date > CURDATE()';
            const result = mainService.convertSqlToPostgres(sql, []);
            assert(result.sql.includes('CURRENT_DATE'));
            assert(!result.sql.includes('CURDATE'));
        });
        
        test('Should convert NOW() to CURRENT_TIMESTAMP', () => {
            const sql = 'SELECT * FROM logs WHERE created > NOW()';
            const result = mainService.convertSqlToPostgres(sql, []);
            assert(result.sql.includes('CURRENT_TIMESTAMP'));
            assert(!result.sql.includes('NOW()'));
        });
    });
    
    describe('Identifiers', () => {
        test('Should convert backticks to double quotes', () => {
            const sql = 'SELECT `id`, `name` FROM `users` WHERE `active` = 1';
            const result = mainService.convertSqlToPostgres(sql, []);
            assert(!result.sql.includes('`'));
            assert(result.sql.includes('"'));
        });
    });
    
    describe('Placeholders', () => {
        test('Should convert ? to $1, $2, etc', () => {
            const sql = 'SELECT * FROM users WHERE id = ? AND name = ?';
            const result = mainService.convertSqlToPostgres(sql, [123, 'John']);
            assert(result.sql.includes('$1'));
            assert(result.sql.includes('$2'));
            assert(!result.sql.includes('?'));
        });
    });
    
    describe('Complex Queries', () => {
        test('Should handle query with multiple conversions', () => {
            const sql = `
                SELECT 
                    id, 
                    name,
                    DATEDIFF(expiry_date, CURDATE()) as days_left
                FROM \`inventory\`
                WHERE created > NOW()
                LIMIT 10, 20
            `;
            const result = mainService.convertSqlToPostgres(sql, []);
            
            assert(result.sql.includes('LIMIT 20 OFFSET 10'));
            assert(result.sql.includes('CURRENT_DATE'));
            assert(result.sql.includes('CURRENT_TIMESTAMP'));
            assert(!result.sql.includes('`'));
            assert(!result.sql.includes('DATEDIFF'));
        });
    });
});
```

---

## 🚀 Implementation Checklist

### Immediate (This week)
- [ ] Apply Fix #1 (LIMIT clause) - `services/commonService.js` line 1362
- [ ] Create SQL conversion test file
- [ ] Run tests with sample queries

### Short-term (This month)
- [ ] Create `database/migrations-postgresql/` folder
- [ ] Convert migration files to PostgreSQL syntax
- [ ] Create `database/init-db.js` script
- [ ] Test with actual PostgreSQL database

### Medium-term (Next month)
- [ ] Test all CRUD operations with PostgreSQL
- [ ] Create user documentation
- [ ] Set up CI/CD testing for both databases

---

## 📚 References

**PostgreSQL Documentation:**
- Date/Time Functions: https://www.postgresql.org/docs/current/functions-datetime.html
- LIMIT/OFFSET: https://www.postgresql.org/docs/current/queries-limit.html
- CREATE TABLE: https://www.postgresql.org/docs/current/sql-createtable.html

**MySQL to PostgreSQL Migration:**
- https://wiki.postgresql.org/wiki/Convert_from_MySQL_to_PostgreSQL

