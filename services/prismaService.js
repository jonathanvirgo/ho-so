require('dotenv').config();
const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// =============================================================================
// Prisma 7 + Supabase (Optimized for Node.js Express)
// =============================================================================

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error(
        '[Prisma] DATABASE_URL environment variable is required.\n' +
        'Please set it in your .env file.'
    );
}

console.log(`[Prisma] Using DATABASE_URL for connections`);

// =============================================================================
// Global Singleton Pattern
// =============================================================================

const globalForPrisma = globalThis;
if (!globalForPrisma._prisma) {
    globalForPrisma._prisma = undefined;
    globalForPrisma._pool = undefined;
}

// =============================================================================
// PostgreSQL Connection Pool
// =============================================================================

const createPool = () => {
    return new Pool({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
        },
        max: 10,
        min: 1,
        idleTimeoutMillis: 300000,
        connectionTimeoutMillis: 60000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
        allowExitOnIdle: false,
        application_name: 'benh-nhan-app',
    });
};

const pool = globalForPrisma._pool ?? createPool();

pool.on('error', (err) => {
    console.error(`[Prisma] Pool error: ${err.message}`);
});

// =============================================================================
// Prisma Client with PostgreSQL Adapter
// =============================================================================

const adapter = new PrismaPg(pool);

const prisma = globalForPrisma._prisma ?? new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma._prisma = prisma;
    globalForPrisma._pool = pool;
}

// =============================================================================
// Connection Health Check
// =============================================================================

// Helper function to mask sensitive parts of DATABASE_URL
const getMaskedDatabaseUrl = () => {
    if (!DATABASE_URL) return 'NOT SET';
    try {
        const url = new URL(DATABASE_URL);
        const maskedPassword = url.password ? '****' : '';
        return `${url.protocol}//${url.username}:${maskedPassword}@${url.host}${url.pathname}`;
    } catch (e) {
        return 'INVALID_URL';
    }
};

const testConnection = async () => {
    const startTime = Date.now();
    console.log('[Prisma] ========== DATABASE CONNECTION TEST ==========');
    console.log('[Prisma] Timestamp:', new Date().toISOString());
    console.log('[Prisma] NODE_ENV:', process.env.NODE_ENV);
    console.log('[Prisma] Database URL (masked):', getMaskedDatabaseUrl());
    
    try {
        const client = await pool.connect();
        const duration = Date.now() - startTime;
        
        // Get database name and version
        const dbInfo = await client.query('SELECT current_database() as db, version() as version');
        const dbName = dbInfo.rows[0]?.db || 'unknown';
        const dbVersion = dbInfo.rows[0]?.version?.split(' ').slice(0, 2).join(' ') || 'unknown';
        
        console.log('[Prisma] ✅ Database connection successful');
        console.log('[Prisma] Database name:', dbName);
        console.log('[Prisma] Database version:', dbVersion);
        console.log('[Prisma] Connection time:', duration + 'ms');
        console.log('[Prisma] Pool stats: total=' + pool.totalCount + ', idle=' + pool.idleCount + ', waiting=' + pool.waitingCount);
        console.log('[Prisma] ================================================');
        
        client.release();
        return true;
    } catch (err) {
        const duration = Date.now() - startTime;
        console.error('[Prisma] ========== DATABASE CONNECTION ERROR ==========');
        console.error('[Prisma] ❌ Connection FAILED');
        console.error('[Prisma] Error:', err.message);
        console.error('[Prisma] Duration:', duration + 'ms');
        console.error('[Prisma] ================================================');
        return false;
    }
};

// Test connection on startup
testConnection();

// =============================================================================
// Graceful Shutdown
// =============================================================================

let isClosing = false;

const cleanup = async () => {
    if (isClosing) return;
    isClosing = true;

    console.log('[Prisma] Closing database connections...');
    try {
        await prisma.$disconnect();
        await pool.end();
        console.log('[Prisma] Database connections closed');
    } catch (err) {
        if (err.message?.includes('end on pool more than once')) {
            return;
        }
        console.error('[Prisma] Error during cleanup:', err);
    }
};

process.on('beforeExit', cleanup);
process.on('SIGINT', async () => {
    await cleanup();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(0);
});

// =============================================================================
// CRUD Helper Functions (Compatible with commonService.js interface)
// =============================================================================

const prismaService = {
    prisma,
    pool,
    testConnection,

    /**
     * Add a record to a table
     * @param {Object} data - Data to insert
     * @param {String} table - Table name (Prisma model name)
     * @param {Boolean} isCreated_at - Whether to add created_at timestamp
     */
    addRecordTable: async function(data, table, isCreated_at = false) {
        try {
            if (isCreated_at) {
                data.created_at = new Date();
            }
            const result = await prisma[table].create({
                data: data
            });
            return {
                success: true,
                message: "Successful",
                data: {
                    insertId: result.id,
                    affectedRows: 1
                }
            };
        } catch (err) {
            console.error(`[Prisma] addRecordTable error:`, err.message);
            return {
                success: false,
                message: err.message
            };
        }
    },

    /**
     * Add multiple records to a table
     * @param {Array} dataArr - Array of data to insert
     * @param {String} table - Table name
     * @param {Boolean} isCreated_at - Whether to add created_at timestamp
     */
    addMutilRecordTable: async function(dataArr, table, isCreated_at = false) {
        try {
            if (!dataArr || dataArr.length === 0) {
                return { success: true, message: "No records to insert", data: { affectedRows: 0 } };
            }

            if (isCreated_at) {
                const now = new Date();
                dataArr = dataArr.map(item => ({ ...item, created_at: now }));
            }

            const result = await prisma[table].createMany({
                data: dataArr,
                skipDuplicates: true
            });

            return {
                success: true,
                message: "Successful",
                data: { affectedRows: result.count }
            };
        } catch (err) {
            console.error(`[Prisma] addMutilRecordTable error:`, err.message);
            return {
                success: false,
                message: err.message
            };
        }
    },

    /**
     * Update a record in a table
     * @param {Object} data - Data to update
     * @param {Object} condition - Where condition
     * @param {String} table - Table name
     */
    updateRecordTable: async function(data, condition, table) {
        try {
            const where = this._buildWhereClause(condition);
            const result = await prisma[table].updateMany({
                where: where,
                data: data
            });
            
            if (result.count === 0) {
                return {
                    success: false,
                    message: 'Không tìm thấy bản ghi!'
                };
            }

            return {
                success: true,
                message: "Successful",
                data: { affectedRows: result.count }
            };
        } catch (err) {
            console.error(`[Prisma] updateRecordTable error:`, err.message);
            return {
                success: false,
                message: err.message
            };
        }
    },

    /**
     * Delete records from a table
     * @param {Object} conditionEqual - Equal conditions
     * @param {Object} conditionUnEqual - Not equal conditions
     * @param {String} table - Table name
     */
    deleteRecordTable: async function(conditionEqual, conditionUnEqual, table) {
        try {
            const where = {};
            
            // Add equal conditions
            for (let key in conditionEqual) {
                const val = conditionEqual[key];
                if (Array.isArray(val)) {
                    where[key] = { in: val };
                } else {
                    where[key] = val;
                }
            }
            
            // Add not equal conditions
            for (let key in conditionUnEqual) {
                const val = conditionUnEqual[key];
                if (Array.isArray(val)) {
                    where[key] = { notIn: val };
                } else {
                    where[key] = { not: val };
                }
            }

            const result = await prisma[table].deleteMany({
                where: where
            });

            return {
                success: true,
                message: "Successful",
                data: { affectedRows: result.count }
            };
        } catch (err) {
            console.error(`[Prisma] deleteRecordTable error:`, err.message);
            return {
                success: false,
                message: err.message
            };
        }
    },

    /**
     * Delete records with simple condition
     * @param {Object} condition - Where condition
     * @param {String} table - Table name
     */
    deleteRecordTable1: async function(condition, table) {
        return this.deleteRecordTable(condition, {}, table);
    },

    /**
     * Get all data from a table with conditions
     * @param {String} table - Table name
     * @param {Object} conditions - Where conditions
     * @param {Object} order - Order by { column: 'id', type: 'desc' }
     * @param {String} logic - 'AND' or 'OR'
     * @param {String|Array} fields - Fields to select
     */
    getAllDataTable: async function(table, conditions = {}, order = { column: 'id', type: 'desc' }, logic = 'AND', fields = null) {
        try {
            const where = this._buildWhereClause(conditions, logic);
            const orderBy = {};
            orderBy[order.column || 'id'] = (order.type || 'desc').toLowerCase();

            const queryOptions = {
                where: where,
                orderBy: orderBy
            };

            // Handle field selection
            if (fields && fields !== '*') {
                if (Array.isArray(fields)) {
                    queryOptions.select = {};
                    fields.forEach(field => {
                        queryOptions.select[field] = true;
                    });
                }
            }

            const data = await prisma[table].findMany(queryOptions);

            return {
                success: true,
                data: data,
                message: "Successful"
            };
        } catch (err) {
            console.error(`[Prisma] getAllDataTable error:`, err.message);
            return {
                success: false,
                message: err.message,
                data: []
            };
        }
    },

    /**
     * Get list with raw SQL or Prisma query
     * @param {String} sql - SQL query (for compatibility, can also be table name)
     * @param {Array} params - Query parameters
     */
    getListTable: async function(sql, params = []) {
        try {
            // Use raw query for complex SQL
            const result = await prisma.$queryRawUnsafe(sql, ...params);
            return {
                success: true,
                data: result,
                message: "Successful"
            };
        } catch (err) {
            console.error(`[Prisma] getListTable error:`, err.message);
            return {
                success: false,
                message: err.message,
                data: []
            };
        }
    },

    /**
     * Count records in a table
     * @param {String} table - Table name
     * @param {Object} conditions - Where conditions
     */
    countListTable: async function(table, conditions = { active: 1 }) {
        try {
            const count = await prisma[table].count({
                where: conditions
            });

            return {
                success: true,
                total: count,
                message: "Successful"
            };
        } catch (err) {
            console.error(`[Prisma] countListTable error:`, err.message);
            return {
                success: false,
                total: 0,
                message: err.message
            };
        }
    },

    /**
     * Get paginated data
     * @param {String} table - Table name
     * @param {Object} conditions - Where conditions
     * @param {Number} skip - Offset
     * @param {Number} take - Limit
     * @param {Object} orderBy - Order by
     */
    getPaginatedData: async function(table, conditions = {}, skip = 0, take = 10, orderBy = { id: 'desc' }) {
        try {
            const where = this._buildWhereClause(conditions);
            
            const [data, total] = await Promise.all([
                prisma[table].findMany({
                    where: where,
                    skip: skip,
                    take: take,
                    orderBy: orderBy
                }),
                prisma[table].count({ where: where })
            ]);

            return {
                success: true,
                data: data,
                total: total,
                message: "Successful"
            };
        } catch (err) {
            console.error(`[Prisma] getPaginatedData error:`, err.message);
            return {
                success: false,
                data: [],
                total: 0,
                message: err.message
            };
        }
    },

    /**
     * Find one record by ID
     * @param {String} table - Table name
     * @param {Number|String} id - Record ID
     */
    findById: async function(table, id) {
        try {
            const data = await prisma[table].findUnique({
                where: { id: id }
            });

            return {
                success: true,
                data: data,
                message: "Successful"
            };
        } catch (err) {
            console.error(`[Prisma] findById error:`, err.message);
            return {
                success: false,
                data: null,
                message: err.message
            };
        }
    },

    /**
     * Build where clause from conditions object
     * @private
     */
    _buildWhereClause: function(conditions, logic = 'AND') {
        if (!conditions || Object.keys(conditions).length === 0) {
            return {};
        }

        const clauses = [];

        for (let field in conditions) {
            const value = conditions[field];
            let clause = {};

            if (typeof value === 'object' && value !== null && value.op) {
                switch (value.op.toUpperCase()) {
                    case '!=':
                        clause[field] = { not: value.value };
                        break;
                    case 'IN':
                        clause[field] = { in: value.value };
                        break;
                    case 'NOT IN':
                        clause[field] = { notIn: value.value };
                        break;
                    case '>':
                        clause[field] = { gt: value.value };
                        break;
                    case '<':
                        clause[field] = { lt: value.value };
                        break;
                    case '>=':
                        clause[field] = { gte: value.value };
                        break;
                    case '<=':
                        clause[field] = { lte: value.value };
                        break;
                    case 'LIKE':
                        clause[field] = { contains: value.value.replace(/%/g, ''), mode: 'insensitive' };
                        break;
                    case 'IS NULL':
                        clause[field] = null;
                        break;
                    case 'IS NOT NULL':
                        clause[field] = { not: null };
                        break;
                    default:
                        clause[field] = value.value;
                }
            } else {
                clause[field] = value;
            }

            clauses.push(clause);
        }

        if (logic.toUpperCase() === 'OR') {
            return { OR: clauses };
        }

        // Merge all clauses for AND
        return Object.assign({}, ...clauses);
    },

    // =============================================================================
    // Patient-specific methods (compatible with commonService.js)
    // =============================================================================

    getAllPatients: async function(parameter) {
        try {
            const where = {
                active: { not: 0 },
                type: parameter.type
            };

            if (parameter.search_value && parameter.search_value !== "") {
                where.fullname = { contains: parameter.search_value, mode: 'insensitive' };
            }

            const data = await prisma.patients.findMany({
                where: where,
                orderBy: { id: 'desc' },
                skip: parameter.skip,
                take: parameter.take
            });

            return {
                success: true,
                data: data
            };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    countAllPatients: async function(parameter) {
        try {
            const where = {
                active: { not: 0 },
                type: parameter.type
            };

            if (parameter.search_value && parameter.search_value !== "") {
                where.fullname = { contains: parameter.search_value, mode: 'insensitive' };
            }

            const count = await prisma.patients.count({ where: where });

            return {
                success: true,
                data: [{ count: count }]
            };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    getAllBoarding: async function(parameter) {
        try {
            const table = parameter.table;
            const where = {
                active: 1,
                patient_id: parameter.patient_id
            };

            if (parameter.search_value && parameter.search_value !== "") {
                where.bat_thuong = { contains: parameter.search_value, mode: 'insensitive' };
            }

            const data = await prisma[table].findMany({
                where: where,
                orderBy: { id: 'desc' },
                skip: parameter.skip,
                take: parameter.take
            });

            return {
                success: true,
                data: data
            };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    countAllBoarding: async function(parameter) {
        try {
            const table = parameter.table;
            const where = {
                active: 1,
                patient_id: parameter.patient_id
            };

            if (parameter.search_value && parameter.search_value !== "") {
                where.bat_thuong = { contains: parameter.search_value, mode: 'insensitive' };
            }

            const count = await prisma[table].count({ where: where });

            return {
                success: true,
                data: [{ count: count }]
            };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }
};

module.exports = prismaService;
