var mysql = require('mysql2');
const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

var state = {
    pool: null,
    mode: null,
    dbType: process.env.DB_TYPE || 'mysql'
};

/**
 * Validate required environment variables for database connection
 * @param {string} dbType - 'mysql' or 'postgres'
 * @returns {object} - { valid: boolean, missing: string[], config: object }
 */
function validateConfig(dbType) {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT) || (dbType === 'postgres' ? 5432 : 3306),
        ssl: process.env.DB_SSL === 'true'
    };

    // Check for DATABASE_URL (PostgreSQL connection string fallback)
    const connectionString = process.env.DATABASE_URL;

    const missing = [];

    // If using connection string for PostgreSQL, that's sufficient
    if (dbType === 'postgres' && connectionString && connectionString.startsWith('postgresql://')) {
        return { valid: true, missing: [], config: { connectionString, ssl: config.ssl } };
    }

    // Otherwise, check individual variables
    if (!config.host) missing.push('DB_HOST');
    if (!config.user) missing.push('DB_USER');
    if (!config.password) missing.push('DB_PASSWORD');
    if (!config.database) missing.push('DB_NAME');

    return {
        valid: missing.length === 0,
        missing,
        config
    };
}

/**
 * Log database configuration (hide sensitive data)
 * @param {string} dbType 
 * @param {object} config 
 */
function logConfig(dbType, config) {
    if (config.connectionString) {
        console.log(`[DB] Type: ${dbType.toUpperCase()}, Using: DATABASE_URL`);
    } else {
        console.log(`[DB] Type: ${dbType.toUpperCase()}, Host: ${config.host}, Port: ${config.port}, Database: ${config.database}, SSL: ${config.ssl}`);
    }
}

exports.connect = function (mode, done) {
    state.pool = null;
    state.mode = mode;
    state.dbType = process.env.DB_TYPE || 'mysql';

    // Validate configuration
    const validation = validateConfig(state.dbType);

    if (!validation.valid) {
        const errorMsg = `Missing required environment variables: ${validation.missing.join(', ')}`;
        console.error(`[DB ERROR] ${errorMsg}`);
        return done(new Error(errorMsg));
    }

    logConfig(state.dbType, validation.config);

    if (state.dbType === 'postgres') {
        // PostgreSQL Connection
        console.log('Connecting to PostgreSQL...');
        try {
            const poolConfig = validation.config.connectionString
                ? {
                    connectionString: validation.config.connectionString,
                    ssl: validation.config.ssl ? { rejectUnauthorized: false } : false
                }
                : {
                    host: validation.config.host,
                    user: validation.config.user,
                    password: validation.config.password,
                    database: validation.config.database,
                    port: validation.config.port,
                    ssl: validation.config.ssl ? { rejectUnauthorized: false } : false
                };

            state.pool = new Pool(poolConfig);

            state.pool.query('SELECT NOW()', (err, res) => {
                if (err) {
                    console.error('[DB ERROR] PostgreSQL connection failed: ' + err.message);
                    return done(err);
                } else {
                    console.log('[DB] PostgreSQL connected successfully');
                    done();
                }
            });
        } catch (err) {
            console.error('[DB ERROR] PostgreSQL connection error: ' + err.message);
            done(err);
        }
    } else {
        // MySQL Connection (Default)
        console.log('Connecting to MySQL...');
        state.pool = mysql.createPool({
            host: validation.config.host,
            user: validation.config.user,
            password: validation.config.password,
            database: validation.config.database,
            port: validation.config.port,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        state.pool.getConnection(function (err, connection) {
            if (err) {
                console.error('[DB ERROR] MySQL connection failed: ' + err.message);
                return done(err);
            } else {
                console.log('[DB] MySQL connected successfully');
                connection.release();
                done();
            }
        });
    }
};

exports.get = function () {
    return state.pool;
};

exports.getDbType = function () {
    return state.dbType;
};

exports.close = function (done) {
    if (state.pool) {
        state.pool.end(done);
    }
};
