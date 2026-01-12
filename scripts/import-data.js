/**
 * Import data from MySQL JSON export to PostgreSQL via Prisma
 * Run: node scripts/import-data.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prismaService = require('../services/prismaService');
const { prisma } = prismaService;

const DATA_FILE = path.join(__dirname, '../database/seeds/10012026.json');

// Mapping MySQL table names to Prisma model names
const TABLE_MAPPING = {
    'audit_logs': 'audit_logs',
    'auth_logs': 'auth_logs',
    'campaign': 'campaign',
    'cat_gan_nho_kpa': 'cat_gan_nho_kpa',
    'dish_foods': 'dish_foods',
    'dishes': 'dishes',
    'food_info': 'food_info',
    'inventory_issue_items': 'inventory_issue_items',
    'inventory_issues': 'inventory_issues',
    'inventory_receipt_items': 'inventory_receipt_items',
    'inventory_receipts': 'inventory_receipts',
    'inventory_stock': 'inventory_stock',
    'inventory_warehouses': 'inventory_warehouses',
    'log_activities': 'log_activities',
    'menu_build_details': 'menu_build_details',
    'menu_builds': 'menu_builds',
    'menu_example': 'menu_example',
    'menu_time': 'menu_time',
    'notification_settings': 'notification_settings',
    'patient_photos': 'patient_photos',
    'patients': 'patients',
    'patients_research': 'patients_research',
    'phieu_hoi_chan_danh_gia': 'phieu_hoi_chan_danh_gia',
    'phieu_hoi_chan_ttc': 'phieu_hoi_chan_ttc',
    'projects': 'projects',
    'research': 'research',
    'role': 'role',
    'role_user': 'role_user',
    'setting': 'setting',
    'survey_configs': 'survey_configs',
    'survey_fields': 'survey_fields',
    'survey_response_data': 'survey_response_data',
    'survey_responses': 'survey_responses',
    'times': 'times',
    'uon_van_kpa': 'uon_van_kpa',
    'uon_van_ls': 'uon_van_ls',
    'uon_van_med': 'uon_van_med',
    'uon_van_sga': 'uon_van_sga',
    'uon_van_ttth': 'uon_van_ttth',
    'uploaded_files': 'uploaded_files',
    'user': 'user',
    'user_session_settings': 'user_session_settings',
    'user_sessions': 'user_sessions',
    'viem_gam_ttcb': 'viem_gam_ttcb',
    'viem_gan_ctdd': 'viem_gan_ctdd',
    'viem_gan_dhnv': 'viem_gan_dhnv',
    'viem_gan_mt1_dhnv': 'viem_gan_mt1_dhnv',
    'viem_gan_mt1_kpa_not': 'viem_gan_mt1_kpa_not',
    'viem_gan_mt1_sga': 'viem_gan_mt1_sga',
    'viem_gan_mt1_so_gan': 'viem_gan_mt1_so_gan',
    'viem_gan_sga': 'viem_gan_sga',
    'viem_gan_td_ngt': 'viem_gan_td_ngt',
    'viem_gan_td_not': 'viem_gan_td_not',
    'viem_gan_tqau': 'viem_gan_tqau',
    'viem_gan_ttdd': 'viem_gan_ttdd',
};

// Tables with foreign key dependencies - import order matters
const IMPORT_ORDER = [
    // No dependencies
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
    
    // Depends on user/campaign
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
    
    // Depends on patients
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
 * Transform MySQL data to PostgreSQL compatible format
 */
function transformData(tableName, record) {
    const transformed = { ...record };
    
    // Convert string IDs and numeric fields to integers
    const intFields = [
        // IDs and foreign keys
        'id', 'user_id', 'patient_id', 'campaign_id', 'created_by', 'role_id', 
        'dish_id', 'food_id', 'time_id', 'menu_build_id', 'warehouse_id', 
        'receipt_id', 'issue_id', 'project_id', 'survey_config_id', 
        'survey_response_id', 'survey_field_id', 'receipt_item_id', 'menu_time_id',
        // Numeric fields that are stored as strings in MySQL
        'gender', 'type', 'status', 'level', 'order_sort', 'priority',
        'max_sessions', 'session_timeout_hours', 'max_responses', 'week_number', 'year',
        'chuong_bung', 'trao_nguoc', 'tao_bon', 'phan_long_3_ngay', 
        'duong_mau_10', 'duong_mau_20', 'so_lan_di_ngoai',
        'field_order', 'response_count', 'view_count', 'day'
    ];
    
    for (const field of intFields) {
        if (transformed[field] !== undefined && transformed[field] !== null) {
            const val = transformed[field];
            if (typeof val === 'string') {
                if (val === '') {
                    transformed[field] = null;
                } else {
                    const parsed = parseInt(val, 10);
                    transformed[field] = isNaN(parsed) ? null : parsed;
                }
            }
        }
    }
    
    // Convert boolean fields
    const boolFields = ['active', 'success', 'share', 'is_active', 'is_current_session', 
                        'is_required', 'is_completed', 'enabled', 'allow_multiple_responses',
                        'require_email', 'allow_multiple_devices', 'notify_new_login', 'auto_logout_inactive'];
    
    for (const field of boolFields) {
        if (transformed[field] !== undefined && transformed[field] !== null) {
            const val = transformed[field];
            if (typeof val === 'string') {
                transformed[field] = parseInt(val, 10) || 0;
            }
        }
    }
    
    // Handle invalid dates (0000-00-00 00:00:00)
    const dateFields = ['created_at', 'updated_at', 'timestamp', 'time', 'birthday', 
                        'ngay_nhap_vien', 'ngay_hoi_chan', 'ngay_dieu_tra', 'start_date', 'end_date',
                        'login_at', 'last_activity', 'logout_at', 'token_created_at', 'last_login',
                        'submitted_at', 'issue_date', 'receipt_date', 'expiry_date'];
    
    for (const field of dateFields) {
        if (transformed[field] !== undefined) {
            const val = transformed[field];
            if (!val || val === '0000-00-00 00:00:00' || val === '0000-00-00' || val === '') {
                // Set to current time if field is required (updated_at often is)
                if (field === 'updated_at' && tableName !== 'user') {
                    transformed[field] = new Date();
                } else {
                    transformed[field] = null;
                }
            } else {
                // Convert string date to Date object
                const date = new Date(val);
                if (isNaN(date.getTime())) {
                    // Invalid date
                    if (field === 'updated_at') {
                        transformed[field] = new Date();
                    } else {
                        transformed[field] = null;
                    }
                } else {
                    transformed[field] = date;
                }
            }
        }
    }
    
    // Handle JSON fields
    const jsonFields = ['details', 'field_options', 'field_settings', 'validation_rules', 
                        'settings', 'metadata', 'field_value_json'];
    
    for (const field of jsonFields) {
        if (transformed[field] !== undefined && transformed[field] !== null) {
            if (typeof transformed[field] === 'string') {
                try {
                    transformed[field] = JSON.parse(transformed[field]);
                } catch {
                    // Keep as is if not valid JSON
                }
            }
        }
    }
    
    // Handle decimal fields
    const decimalFields = ['quantity', 'unit_price', 'total_price', 'total_amount', 
                           'quantity_in', 'quantity_out', 'quantity_available',
                           'protein', 'lipid', 'glucid', 'energy', 'fiber', 'calcium', 
                           'iron', 'zinc', 'vitamin_a', 'vitamin_c'];
    
    for (const field of decimalFields) {
        if (transformed[field] !== undefined && transformed[field] !== null) {
            const val = transformed[field];
            if (typeof val === 'string') {
                if (val === '') {
                    transformed[field] = null;
                } else {
                    transformed[field] = parseFloat(val) || 0;
                }
            }
        }
    }
    
    // Remove undefined fields
    for (const key of Object.keys(transformed)) {
        if (transformed[key] === undefined) {
            delete transformed[key];
        }
    }
    
    return transformed;
}

/**
 * Import a single table's data
 */
async function importTable(tableName, data) {
    const modelName = TABLE_MAPPING[tableName];
    
    if (!modelName || !prisma[modelName]) {
        console.log(`⚠️  Skipping unknown table: ${tableName}`);
        return { success: false, count: 0, error: 'Unknown table' };
    }
    
    if (!data || data.length === 0) {
        console.log(`   ⏭️  ${tableName}: No data to import`);
        return { success: true, count: 0 };
    }
    
    console.log(`   📥 Importing ${tableName} (${data.length} records)...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of data) {
        try {
            const transformedRecord = transformData(tableName, record);
            
            // Use createMany for better performance, falling back to create for errors
            await prisma[modelName].create({
                data: transformedRecord
            });
            successCount++;
        } catch (err) {
            errorCount++;
            if (errorCount <= 3) {
                console.error(`      ❌ Error in ${tableName}: ${err.message}`);
            }
        }
    }
    
    if (errorCount > 3) {
        console.log(`      ... and ${errorCount - 3} more errors`);
    }
    
    console.log(`   ✅ ${tableName}: ${successCount}/${data.length} imported`);
    
    return { success: true, count: successCount, errors: errorCount };
}

/**
 * Reset sequences after import
 */
async function resetSequences() {
    console.log('\n🔄 Resetting sequences...');
    
    const tables = Object.keys(TABLE_MAPPING);
    
    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`
                SELECT setval(pg_get_serial_sequence('${table}', 'id'), 
                       COALESCE((SELECT MAX(id) FROM "${table}"), 1), 
                       true)
            `);
        } catch (err) {
            // Some tables might not have sequences
        }
    }
    
    console.log('✅ Sequences reset completed');
}

/**
 * Main import function
 */
async function importData() {
    console.log('='.repeat(60));
    console.log('MySQL to PostgreSQL Data Import');
    console.log('='.repeat(60));
    
    // Read JSON file
    console.log(`\n📁 Reading ${DATA_FILE}...`);
    
    if (!fs.existsSync(DATA_FILE)) {
        console.error(`❌ File not found: ${DATA_FILE}`);
        process.exit(1);
    }
    
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    const jsonData = JSON.parse(rawData);
    
    console.log(`   Found ${jsonData.length} entries in JSON file`);
    
    // Extract tables from JSON
    const tables = {};
    for (const entry of jsonData) {
        if (entry.type === 'table' && entry.data) {
            tables[entry.name] = entry.data;
        }
    }
    
    console.log(`   Found ${Object.keys(tables).length} tables with data`);
    
    // Import in order
    console.log('\n📥 Starting import...\n');
    
    const results = {};
    let totalImported = 0;
    let totalErrors = 0;
    
    for (const tableName of IMPORT_ORDER) {
        if (tables[tableName]) {
            const result = await importTable(tableName, tables[tableName]);
            results[tableName] = result;
            totalImported += result.count || 0;
            totalErrors += result.errors || 0;
        }
    }
    
    // Import remaining tables not in IMPORT_ORDER
    for (const tableName of Object.keys(tables)) {
        if (!IMPORT_ORDER.includes(tableName) && !results[tableName]) {
            const result = await importTable(tableName, tables[tableName]);
            results[tableName] = result;
            totalImported += result.count || 0;
            totalErrors += result.errors || 0;
        }
    }
    
    // Reset sequences
    await resetSequences();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Import Summary');
    console.log('='.repeat(60));
    console.log(`Total records imported: ${totalImported}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log('='.repeat(60));
    
    // Cleanup
    await prisma.$disconnect();
    process.exit(0);
}

// Run import
importData().catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
});
