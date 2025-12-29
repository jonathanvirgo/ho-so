var mysql = require('mysql2');
const { Pool } = require('pg');
require('dotenv').config();

var state = {
    pool: null,
    mode: null,
    dbType: process.env.DB_TYPE || 'mysql'
};

exports.connect = function (mode, done) {
    state.pool = null;
    state.mode = mode;
    state.dbType = process.env.DB_TYPE || 'mysql';

    if (state.dbType === 'postgres') {
        // PostgreSQL Connection
        console.log('Connecting to PostgreSQL...');
        try {
            if (!process.env.DATABASE_URL) {
                return done(new Error('DATABASE_URL is missing for PostgreSQL connection'));
            }

            state.pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: {
                    rejectUnauthorized: false
                }
            });

            state.pool.query('SELECT NOW()', (err, res) => {
                if (err) {
                    console.error('PostgreSQL authentication failed (first attempt): ' + err.message);
                    return done(err);
                } else {
                    console.log('PostgreSQL connected');
                    done();
                }
            });
        } catch (err) {
            done(err);
        }
    } else {
        // MySQL Connection (Default)
        console.log('Connecting to MySQL...');
        state.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        state.pool.getConnection(function (err, connection) {
            if (err) {
                console.error('MySQL connection failed: ' + err.message);
                return done(err);
            } else {
                console.log('MySQL connected');
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
