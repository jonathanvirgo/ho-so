/**
 * Import data from MySQL JSON export to PostgreSQL using raw SQL
 * This bypasses Prisma type checking for faster and more reliable import
 * 
 * Run: node scripts/import-data-raw.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATA_FILE = path.join(__dirname, '../database/seeds/10012026.json');

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    max: 5,
    connectionTimeoutMillis: 60000,
});

// Tables to skip (no data or problematic)
const SKIP_TABLES = ['header', 'database'];

// Import order (tables with foreign keys should come after their dependencies)
const IMPORT_ORDER = [
    // Core tables first
    'campaign',
    'role',
    'user',
    'research',
    'setting',
    'menu_time',
    'menu_example',
    'uon_van_med',
    'food_info',
    'projects',
    
    // Tables that depend on user/campaign
    'audit_logs',
    'auth_logs',
    'patients',
    'patients_research',
    'times',
    'log_activities',
    'role_user',
    'user_sessions',
    'user_session_settings',
    'notification_settings',
    
    // Tables that depend on patients
    'patient_photos',
    'cat_gan_nho_kpa',
    'phieu_hoi_chan_danh_gia',
    'phieu_hoi_chan_ttc',
    'viem_gam_ttcb',
    'viem_gan_ctdd',
    'viem_gan_dhnv',
    'viem_gan_mt1_dhnv',
    'viem_gan_mt1_kpa_not',
    'viem_gan_mt1_sga',
    'viem_gan_mt1_so_gan',
    'viem_gan_sga',
    'viem_gan_td_ngt',
    'viem_gan_td_not',
    'viem_gan_tqau',
    'viem_gan_ttdd',
    'uon_van_kpa',
    'uon_van_ls',
    'uon_van_sga',
    'uon_van_ttth',
    
    // Menu system
    'dishes',
    'dish_foods',
    'menu_builds',
    'menu_build_details',
    
    // Inventory
    'inventory_warehouses',
    'inventory_receipts',
    'inventory_receipt_items',
    'inventory_issues',
    'inventory_issue_items',
    'inventory_stock',
    
    // Survey system
    'survey_configs',
    'survey_fields',
    'survey_responses',
    'survey_response_data',
    'uploaded_files',
];

/**
 * Convert MySQL value to PostgreSQL compatible format
 */
function convertValue(value, columnName) {
    if (value === null || value === undefined) {
        return 'NULL';
    }
    
    // Handle empty strings for numeric fields
    if (value === '') {
        // Common numeric column patterns
        const numericPatterns = [
            /_id$/, /^id$/, /gender/, /type/, /status/, /level/, /active/,
            /order_sort/, /max_/, /count/, /number/, /week/, /year/, /day/,
            /priority/, /share/, /point/, /total/, /quantity/,
        ];
        
        for (const pattern of numericPatterns) {
            if (pattern.test(columnName)) {
                return 'NULL';
            }
        }
        return "''";
    }
    
    // Handle invalid dates
    if (value === '0000-00-00 00:00:00' || value === '0000-00-00') {
        return 'NULL';
    }
    
    // Handle boolean-like values
    if (typeof value === 'boolean') {
        return value ? '1' : '0';
    }
    
    // Handle strings - escape single quotes
    if (typeof value === 'string') {
        const escaped = value.replace(/'/g, "''");
        return `'${escaped}'`;
    }
    
    // Handle numbers
    if (typeof value === 'number') {
        return value.toString();
    }
    
    // Default to string
    return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * Build INSERT statement for a record
 */
function buildInsertSQL(tableName, record) {
    // Handle NULL updated_at by using created_at or NOW()
    if ('updated_at' in record) {
        const val = record.updated_at;
        if (val === null || val === undefined || val === '' || val === '0000-00-00 00:00:00') {
            if (record.created_at && record.created_at !== '0000-00-00 00:00:00' && record.created_at !== '') {
                record.updated_at = record.created_at;
            } else {
                record.updated_at = '__NOW__';
            }
        }
    }
    
    // Handle NULL time field (for viem_gan_mt1_kpa_not etc.) by using created_at or NOW()
    if ('time' in record) {
        const val = record.time;
        if (val === null || val === undefined || val === '' || val === '0000-00-00 00:00:00') {
            if (record.created_at && record.created_at !== '0000-00-00 00:00:00' && record.created_at !== '') {
                record.time = record.created_at;
            } else {
                record.time = '__NOW__';
            }
        }
    }
    
    const columns = Object.keys(record);
    const values = columns.map(col => {
        if (record[col] === '__NOW__') {
            return 'NOW()';
        }
        return convertValue(record[col], col);
    });
    
    // Escape column names with double quotes
    const quotedColumns = columns.map(col => `"${col}"`);
    
    return `INSERT INTO "${tableName}" (${quotedColumns.join(', ')}) VALUES (${values.join(', ')})`;
}

/**
 * Disable foreign key constraints
 */
async function disableConstraints(client) {
    await client.query('SET session_replication_role = replica;');
    console.log('   ⚙️  Foreign key constraints disabled');
}

/**
 * Enable foreign key constraints
 */
async function enableConstraints(client) {
    await client.query('SET session_replication_role = DEFAULT;');
    console.log('   ⚙️  Foreign key constraints enabled');
}

/**
 * Reset sequence for a table
 */
async function resetSequence(client, tableName) {
    try {
        const result = await client.query(`
            SELECT column_default 
            FROM information_schema.columns 
            WHERE table_name = $1 AND column_name = 'id'
        `, [tableName]);
        
        if (result.rows.length > 0 && result.rows[0].column_default?.includes('nextval')) {
            await client.query(`
                SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), 
                       COALESCE((SELECT MAX(id) FROM "${tableName}"), 1), true)
            `);
        }
    } catch (err) {
        // Ignore errors for tables without id column or sequences
    }
}

/**
 * Import a single table
 */
async function importTable(client, tableName, data) {
    if (!data || data.length === 0) {
        console.log(`   ⏭️  ${tableName}: No data`);
        return { success: 0, errors: 0 };
    }
    
    console.log(`   📥 ${tableName} (${data.length} records)...`);
    
    let success = 0;
    let errors = 0;
    const errorMessages = new Set();
    
    for (const record of data) {
        try {
            const sql = buildInsertSQL(tableName, record);
            await client.query(sql);
            success++;
        } catch (err) {
            errors++;
            // Collect unique error messages
            const shortError = err.message.split('\n')[0].substring(0, 100);
            errorMessages.add(shortError);
            
            if (errors <= 2) {
                console.log(`      ❌ ${shortError}`);
            }
        }
    }
    
    if (errors > 2) {
        console.log(`      ... and ${errors - 2} more errors`);
    }
    
    if (errorMessages.size > 0 && errors > 2) {
        console.log(`      Unique errors: ${errorMessages.size}`);
    }
    
    console.log(`   ✅ ${tableName}: ${success}/${data.length} imported`);
    
    return { success, errors };
}

/**
 * Main import function
 */
async function importData() {
    console.log('='.repeat(60));
    console.log('MySQL to PostgreSQL Raw SQL Import');
    console.log('='.repeat(60));
    
    // Read JSON file
    console.log(`\n📁 Reading ${DATA_FILE}...`);
    
    if (!fs.existsSync(DATA_FILE)) {
        console.error(`❌ File not found: ${DATA_FILE}`);
        process.exit(1);
    }
    
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    const jsonData = JSON.parse(rawData);
    
    // Extract tables from JSON
    const tables = {};
    for (const entry of jsonData) {
        if (entry.type === 'table' && entry.data && entry.data.length > 0) {
            tables[entry.name] = entry.data;
        }
    }
    
    console.log(`   Found ${Object.keys(tables).length} tables with data`);
    
    // Get a connection
    const client = await pool.connect();
    
    try {
        console.log('\n🔧 Preparing import...');
        
        // Disable foreign key constraints for faster import
        await disableConstraints(client);
        
        console.log('\n📥 Starting import...\n');
        
        let totalSuccess = 0;
        let totalErrors = 0;
        const importedTables = new Set();
        
        // Import in order
        for (const tableName of IMPORT_ORDER) {
            if (tables[tableName] && !SKIP_TABLES.includes(tableName)) {
                const result = await importTable(client, tableName, tables[tableName]);
                totalSuccess += result.success;
                totalErrors += result.errors;
                importedTables.add(tableName);
            }
        }
        
        // Import remaining tables
        for (const tableName of Object.keys(tables)) {
            if (!importedTables.has(tableName) && !SKIP_TABLES.includes(tableName)) {
                const result = await importTable(client, tableName, tables[tableName]);
                totalSuccess += result.success;
                totalErrors += result.errors;
            }
        }
        
        // Reset sequences
        console.log('\n🔄 Resetting sequences...');
        for (const tableName of Object.keys(tables)) {
            await resetSequence(client, tableName);
        }
        console.log('   ✅ Sequences reset');
        
        // Re-enable constraints
        await enableConstraints(client);
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('Import Summary');
        console.log('='.repeat(60));
        console.log(`Total records imported: ${totalSuccess}`);
        console.log(`Total errors: ${totalErrors}`);
        console.log(`Success rate: ${((totalSuccess / (totalSuccess + totalErrors)) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));
        
    } finally {
        client.release();
        await pool.end();
    }
    
    process.exit(0);
}

// Run
importData().catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
});
