var path = require('path'),
    axios = require('axios'),
    moment = require('moment'),
    db = require('../config/db'),
    env = require('dotenv').config();
const { Telegraf } = require('telegraf');
const securityService = require('./securityService');

let mainService = {
    getApiCommon: function (url, access_token) {
        try {
            return new Promise((resolve, reject) => {
                axios({
                    method: 'get',
                    url: url,
                    maxBodyLength: Infinity,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': 'Bearer ' + access_token
                    }
                }).then(function (response) {
                    if (response.status == 200) {
                        // mylog.log(util.inspect(response.data));
                        resolve({ data: response.data, success: true, status: response.status, statusText: response.statusText });
                    } else {
                        // mylog.error(util.inspect(response));
                        resolve({ success: false, status: response.status, statusText: response.statusText, message: '' });
                    }
                }).catch(function (error) {
                    mainService.errorAxios(error);
                    // mylog.error(util.inspect(error.message));
                    resolve({ success: false, status: '404', statusText: 'E404', message: error.message });
                });
            })
        } catch (err) {
            // mylog.error(util.inspect(err));
        }
    },
    postApiCommon: function (data, url, headers) {
        try {
            var header = headers ? headers :
                {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            return new Promise((resolve, reject) => {
                axios({
                    method: 'post',
                    url: url,
                    data: data,
                    maxBodyLength: Infinity,
                    headers: header
                })
                    .then(function (response) {
                        if (response.status == 200) {
                            resolve({ data: response.data, success: true, status: response.status, statusText: response.statusText });
                        } else {
                            // mylog.error(util.inspect(response));
                            resolve({ success: false, status: response.status, statusText: response.statusText, message: '' });
                        }
                    })
                    .catch(function (error) {
                        mainService.errorAxios(error);
                        // mylog.error(util.inspect(error));
                        resolve({ success: false, status: '404', statusText: 'E404', message: error.message });
                    });
            })
        } catch (error) {
            // mylog.error(util.inspect(err));
        }
    },
    viewPage(name) {
        return path.resolve(__dirname, "../views/" + name + ".ejs");
    },
    isJSON: function (str) {
        try {
            return (JSON.parse(str) && !!str);
        } catch (e) {
            return false;
        }
    },
    removeVietnameseTones: function (str) {
        try {
            str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
            str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
            str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
            str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
            str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
            str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
            str = str.replace(/đ/g, "d");
            str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
            str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
            str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
            str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
            str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
            str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
            str = str.replace(/Đ/g, "D");
            // Some system encode vietnamese combining accent as individual utf-8 characters
            // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
            str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
            str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
            // Remove extra spaces
            // Bỏ các khoảng trắng liền nhau
            str = str.replace(/ + /g, " ");
            str = str.trim();
            // Remove punctuations
            // Bỏ dấu câu, kí tự đặc biệt
            str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
            return str;
        } catch (error) {

        }
    },
    fullUrl: function (request) {
        try {
            const fullUrl = new URL(request.url, `${request.protocol}://${request.hostname}`);
            return fullUrl.toString();
        } catch (error) {

        }
    },
    numberFormat: function (price) {
        var numberFormat = new Intl.NumberFormat('de-DE');
        return numberFormat.format(price);
    },
    errorAxios(error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
        } else {
            // Something happened in setting up the request that triggered an Error
        }
    },
    checkEmail: function (email) {
        let reg = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return reg.test(email);
    },
    convertSqlToPostgres: function (sql, params) {
        let pIdx = 1;
        let newSql = sql;
        let newParams = params ? [...params] : [];

        // Replace ? with $1, $2...
        if (newSql.includes('?')) {
            const parts = newSql.split('?');
            newSql = parts.reduce((acc, part, i) => {
                if (i === parts.length - 1) return acc + part;
                return acc + part + '$' + (pIdx++);
            }, '');
        }

        // Replace backticks with double quotes
        newSql = newSql.replace(/`/g, '"');

        // Handle DATEDIFF(date1, date2) -> (date1::date - date2::date)
        // This must be done before CURDATE() replacement if date2 is CURDATE()
        // Regex captures two arguments separated by comma, ignoring whitespace
        newSql = newSql.replace(/DATEDIFF\s*\(([^,]+),\s*([^)]+)\)/gi, '($1::date - $2::date)');

        // Basic function replacements
        newSql = newSql.replace(/CURDATE\(\)/gi, 'CURRENT_DATE');
        newSql = newSql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');

        // LIMIT offset, count -> LIMIT count OFFSET offset
        const limitRegex = /LIMIT\s+(\d+)\s*,\s*(\d+)/i;
        const match = newSql.match(limitRegex);
        if (match) {
            newSql = newSql.replace(limitRegex, `LIMIT ${match[2]} OFFSET ${match[1]}`);
        }

        return { sql: newSql, params: newParams };
    },
    /**
     * Build LIMIT clause compatible with both MySQL and PostgreSQL
     * @param {number} offset - Start position (skip)
     * @param {number} count - Number of records (take)
     * @returns {string} - LIMIT clause string
     */
    buildLimitClause: function (offset, count) {
        if (db.getDbType() === 'postgres') {
            return ` LIMIT ${count} OFFSET ${offset}`;
        } else {
            return ` LIMIT ${offset}, ${count}`;
        }
    },
    addRecordTable: function (param, table, isCreated_at = false) {
        return new Promise((resolve, reject) => {
            if (db.getDbType() === 'postgres') {
                let cols = [];
                let vals = [];
                let placeholders = [];
                let count = 1;

                for (let i in param) {
                    cols.push('"' + i + '"');
                    vals.push(param[i]);
                    placeholders.push('$' + count++);
                }

                let sql = 'INSERT INTO "' + table + '" (' + cols.join(',') + (isCreated_at ? ', "created_at"' : '') + ') VALUES (' + placeholders.join(',') + (isCreated_at ? ', CURRENT_TIMESTAMP' : '') + ') RETURNING id';

                db.get().query(sql, vals, (err, res) => {
                    if (err) {
                        return resolve({
                            success: false,
                            message: err.message
                        });
                    }
                    resolve({
                        success: true,
                        message: "Successful",
                        data: {
                            insertId: res.rows[0]?.id,
                            affectedRows: res.rowCount
                        }
                    });
                });
            } else {
                db.get().getConnection(function (err, connection) {
                    if (err) {
                        resolve({
                            success: false,
                            message: err.sqlMessage
                        });
                    }
                    let sql = 'INSERT INTO ' + table + '(';
                    let textVal = ') VALUES (';
                    if (isCreated_at) {
                        textVal = ',created_at) VALUES (';
                    }
                    let paramSql = [];
                    let j = 0;
                    for (var i in param) {
                        if (j == 0) {
                            sql += '`' + i + '`';
                            textVal += '?';
                            j = 1;
                        } else {
                            sql += ',`' + i + '`';
                            textVal += ',?';
                        }
                        paramSql.push(param[i]);
                    }
                    let sqlQuery = sql + textVal + ')';
                    if (isCreated_at) {
                        sqlQuery = sql + textVal + ',CURRENT_TIMESTAMP)';
                    }

                    let query = connection.query(sqlQuery, paramSql, function (error, results, fields) {
                        connection.release();
                        if (error) {
                            resolve({
                                success: false,
                                message: error.sqlMessage
                            });
                        }
                        resolve({
                            success: true,
                            message: "Successful",
                            data: results
                        });
                    });
                });
            }
        });
    },
    addMutilRecordTable: function (paramArr, table, isCreated_at = false) {
        return new Promise((resolve, reject) => {
            if (db.getDbType() === 'postgres') {
                // PostgreSQL version
                if (!paramArr || paramArr.length === 0) {
                    return resolve({ success: true, message: "No records to insert", data: { affectedRows: 0 } });
                }

                const columns = Object.keys(paramArr[0]);
                const colNames = columns.map(c => `"${c}"`).join(', ');

                let paramSql = [];
                let valueRows = [];
                let paramIndex = 1;

                for (const param of paramArr) {
                    const placeholders = columns.map(() => `$${paramIndex++}`);
                    if (isCreated_at) {
                        placeholders.push('CURRENT_TIMESTAMP');
                    }
                    valueRows.push(`(${placeholders.join(', ')})`);
                    columns.forEach(col => paramSql.push(param[col]));
                }

                const createdAtCol = isCreated_at ? ', "created_at"' : '';
                const sql = `INSERT INTO "${table}" (${colNames}${createdAtCol}) VALUES ${valueRows.join(', ')} RETURNING id`;

                db.get().query(sql, paramSql, (err, res) => {
                    if (err) {
                        return resolve({ success: false, message: err.message });
                    }
                    resolve({
                        success: true,
                        message: "Successful",
                        data: { affectedRows: res.rowCount, insertedIds: res.rows.map(r => r.id) }
                    });
                });
            } else {
                // MySQL version
                db.get().getConnection(function (err, connection) {
                    if (err) {
                        resolve({
                            success: false,
                            message: err.sqlMessage
                        });
                    }
                    let sqlInsert = 'INSERT INTO ' + table + '(';
                    let sqlInsert2 = ') VALUES ';
                    if (isCreated_at) {
                        sqlInsert2 = ',created_at) VALUES ';
                    }
                    let sqlVal = '';
                    let paramSql = [];

                    if (paramArr.length > 0) {
                        for (let [index, param] of paramArr.entries()) {
                            if (index == 0) {
                                let j = 0;
                                for (var i in param) {
                                    if (j == 0) {
                                        sqlInsert += i;
                                        sqlVal += '(?';
                                        j = 1;
                                    } else {
                                        sqlInsert += ',' + i;
                                        sqlVal += ',?';
                                    }
                                    paramSql.push(param[i]);
                                }
                                if (isCreated_at) {
                                    sqlInsert += ',created_at) VALUES ';
                                    sqlVal += ',CURRENT_TIMESTAMP)';
                                } else {
                                    sqlVal += ')';
                                    sqlInsert += ') VALUES ';
                                }
                            } else {
                                let j = 0;
                                for (var i in param) {
                                    if (j == 0) {
                                        sqlVal += ',(?';
                                        j = 1;
                                    } else {
                                        sqlVal += ',?';
                                    }
                                    paramSql.push(param[i]);
                                }
                                if (isCreated_at) {
                                    sqlVal += ',CURRENT_TIMESTAMP)';
                                } else {
                                    sqlVal += ')';
                                }
                            }
                        }
                    }
                    let sqlQuery = sqlInsert + sqlVal;
                    let query = connection.query(sqlQuery, paramSql, function (error, results, fields) {
                        connection.release();
                        if (error) {
                            resolve({
                                success: false,
                                message: error.sqlMessage
                            });
                        }
                        resolve({
                            success: true,
                            message: "Successful",
                            data: results
                        });
                    });
                });
            }
        })
    },
    deleteRecordTable: function (conditionEqual, conditionUnEqual, table) {
        return new Promise((resolve, reject) => {
            if (db.getDbType() === 'postgres') {
                let sql = 'DELETE FROM "' + table + '" WHERE ';
                let paramSql = [];
                let count = 1;
                let first = true;

                for (let i in conditionEqual) {
                    if (!first) sql += ' AND ';
                    first = false;
                    let val = conditionEqual[i];
                    if (Array.isArray(val)) {
                        sql += '"' + i + '" = ANY($' + (count++) + ')';
                        paramSql.push(val);
                    } else {
                        sql += '"' + i + '" = $' + (count++);
                        paramSql.push(val);
                    }
                }
                for (let m in conditionUnEqual) {
                    if (!first) sql += ' AND ';
                    first = false;
                    let val = conditionUnEqual[m];
                    if (Array.isArray(val)) {
                        sql += '"' + m + '" != ALL($' + (count++) + ')';
                        paramSql.push(val);
                    } else {
                        sql += '"' + m + '" != $' + (count++);
                        paramSql.push(val);
                    }
                }

                db.get().query(sql, paramSql, function (error, results) {
                    if (error) return resolve({ success: false, message: error.message });
                    resolve({
                        success: true,
                        message: "Successful",
                        data: { affectedRows: results.rowCount }
                    });
                });
            } else {
                db.get().getConnection(function (err, connection) {
                    if (err) resolve({ success: false, message: err.sqlMessage });
                    let sql = 'DELETE FROM ' + table + ' WHERE ';
                    let paramSql = [];
                    let j = 0;
                    let k = 0;
                    for (let i in conditionEqual) {
                        let sqlC = '';
                        if (Array.isArray(conditionEqual[i])) {
                            sqlC = ' IN (?)';
                        } else {
                            sqlC = ' = ?';
                        }
                        if (j == 0) {
                            sql += i + sqlC;
                            j = 1;
                        } else {
                            sql += ' AND ' + i + sqlC;
                        }
                        paramSql.push(conditionEqual[i]);
                    }
                    for (let m in conditionUnEqual) {
                        let sqlC = '';
                        if (Array.isArray(conditionUnEqual[m])) {
                            sqlC = ' NOT IN (?)';
                        } else {
                            sqlC = ' != ?';
                        }
                        if (k == 0) {
                            sql += m + sqlC;
                            k = 1;
                        } else {
                            sql += ' AND ' + m + sqlC;
                        }
                        paramSql.push(conditionUnEqual[m]);
                    }
                    connection.query(sql, paramSql, function (error, results, fields) {
                        connection.release();
                        if (error) resolve({ success: false, message: error.sqlMessage });
                        resolve({
                            success: true,
                            message: "Successful",
                            data: results
                        });
                    });
                });
            }
        })
    },
    deleteRecordTable1: function (condition, table) {
        return new Promise((resolve, reject) => {
            if (db.getDbType() === 'postgres') {
                let sql = 'DELETE FROM "' + table + '" WHERE ';
                let paramSql = [];
                let count = 1;
                let first = true;
                for (var i in condition) {
                    if (!first) sql += ' AND ';
                    first = false;
                    sql += '"' + i + '" = $' + (count++);
                    paramSql.push(condition[i]);
                }
                db.get().query(sql, paramSql, function (error, results) {
                    if (error) return resolve({ success: false, message: error.message });
                    resolve({
                        success: true,
                        message: "Successful",
                        data: { affectedRows: results.rowCount }
                    });
                });
            } else {
                db.get().getConnection(function (err, connection) {
                    if (err) resolve({ success: false, message: err.sqlMessage });
                    let sql = 'DELETE FROM ' + table + ' WHERE ';
                    let paramSql = [];
                    let j = 0;
                    for (var i in condition) {
                        if (j == 0) {
                            sql += i + ' = ?';
                            j = 1;
                        } else {
                            sql += ' AND ' + i + ' = ?';
                        }
                        paramSql.push(condition[i]);
                    }
                    connection.query(sql, paramSql, function (error, results, fields) {
                        connection.release();
                        if (error) resolve({ success: false, message: error.sqlMessage });
                        resolve({
                            success: true,
                            message: "Successful",
                            data: results
                        });
                    });
                });
            }
        })
    },
    updateRecordTable: function (param, condition, table) {
        return new Promise((resolve, reject) => {
            if (db.getDbType() === 'postgres') {
                let sql = 'UPDATE "' + table + '" SET ';
                let paramSql = [];
                let count = 1;

                let first = true;
                if (typeof (param) == 'object') {
                    for (let i in param) {
                        if (!first) sql += ', ';
                        first = false;
                        sql += '"' + i + '" = $' + (count++);
                        paramSql.push(param[i]);
                    }
                } else {
                    // convert raw sql fragment
                    const converted = mainService.convertSqlToPostgres(param, []);
                    sql += converted.sql;
                    // assuming no params in raw fragment or handled separately
                }

                let firstWhere = true;
                for (let k in condition) {
                    if (firstWhere) {
                        sql += ' WHERE ';
                        firstWhere = false;
                    } else {
                        sql += ' AND ';
                    }
                    sql += '"' + k + '" = $' + (count++);
                    paramSql.push(condition[k]);
                }

                db.get().query(sql, paramSql, function (error, results) {
                    if (error) {
                        return resolve({
                            success: false,
                            message: error.message
                        });
                    }
                    resolve({
                        success: true,
                        message: "Successful",
                        data: { affectedRows: results.rowCount }
                    });
                });
            } else {
                db.get().getConnection(function (err, connection) {
                    if (err) {
                        resolve({
                            success: false,
                            message: err.sqlMessage
                        });
                    }
                    let sql = 'UPDATE ' + table + ' SET ';
                    let paramSql = [];
                    if (typeof (param) == 'object') {
                        let j = 0;
                        for (let i in param) {
                            if (j == 0) {
                                sql += i + ' = ?';
                                j = 1;
                            } else {
                                sql += ', ' + i + ' = ?';
                            }
                            paramSql.push(param[i]);
                        }
                    } else {
                        sql += param;
                    }

                    let l = 0;
                    for (let k in condition) {
                        if (l == 0) {
                            sql += ' WHERE ' + k + ' = ?';
                            l = 1;
                        } else {
                            sql += ' AND ' + k + ' = ?';
                        }
                        paramSql.push(condition[k]);
                    }
                    let query = connection.query(sql, paramSql, function (error, results, fields) {
                        connection.release();
                        if (error || !results.affectedRows) {
                            resolve({
                                success: false,
                                message: error ? error.sqlMessage : 'Không tìm thấy bản ghi!'
                            });
                        }
                        resolve({
                            success: true,
                            message: "Successful",
                            data: results
                        });
                    });
                });
            }
        });
    },
    getListTable: function (sql, paramSql) {
        return new Promise((resolve, reject) => {
            if (db.getDbType() === 'postgres') {
                const converted = mainService.convertSqlToPostgres(sql, paramSql);
                db.get().query(converted.sql, converted.params, function (error, results) {
                    if (error) {
                        return resolve({
                            success: false,
                            message: error.message
                        });
                    }
                    resolve({
                        success: true,
                        data: results.rows,
                        message: "Successful"
                    });
                });
            } else {
                db.get().getConnection(function (err, connection) {
                    if (err) {
                        resolve({
                            success: false,
                            message: err.sqlMessage
                        });
                    }

                    let query = connection.query(sql, paramSql, function (error, results, fields) {
                        connection.release();
                        if (error) {
                            resolve({
                                success: false,
                                message: error.sqlMessage
                            });
                        }
                        resolve({
                            success: true,
                            data: results,
                            message: "Successful"
                        });
                    });
                });
            }
        });
    },
    countListTable: function (table, param) {
        return new Promise((resolve, reject) => {
            let results = {
                success: false,
                message: '',
                total: 0
            }
            let sql = 'SELECT COUNT(id) AS total FROM ' + table + ' WHERE active = 1';
            let paramSql = [];
            mainService.getListTable(sql, paramSql).then(responseData => {
                if (responseData.success && responseData.data && responseData.data.length > 0) {
                    results.success = true;
                    results.total = responseData.data[0].total ? responseData.data[0].total : 0;
                } else {
                    results.message = responseData.message;
                }
                resolve(results);
            })
        })
    },
    getAllDataTableOld: function (table, condition, orderType = 'desc') {
        return new Promise((resolve, reject) => {
            let results = {
                success: false,
                message: '',
                data: []
            }
            let sql = 'SELECT * FROM ' + table + ' WHERE 1=1 ';
            let paramSql = [];
            if (typeof (condition) == 'object') {
                for (let i in condition) {
                    sql += ' AND ' + i + ' = ?';
                    paramSql.push(condition[i]);
                }
            }

            sql += ` ORDER BY id ${orderType}`;

            mainService.getListTable(sql, paramSql).then(responseData => {
                if (responseData.success && responseData.data) {
                    results.success = true;
                    if (responseData.data.length > 0) {
                        results.data = responseData.data;
                    }
                } else {
                    results.message = responseData.message;
                }
                resolve(results)
            })
        })
    },
    // const conditions = {
    //     status: 1,
    //     age: { op: '>', value: 25 },
    //     id: { op: '!=', value: 10 },
    //     category: { op: 'IN', value: [1, 2, 3] },
    //     name: { op: 'LIKE', value: '%john%' } // Tìm tên chứa "john"
    // };

    // const order = {
    //     column: 'created_at',
    //     type: 'asc'
    // };
    getAllDataTable: function (table, conditions = {}, order = { column: 'id', type: 'desc' }, logic = 'AND', fields = '*') {
        return new Promise((resolve, reject) => {
            let results = {
                success: false,
                message: '',
                data: []
            };

            try {
                // Validate table name to prevent SQL injection
                securityService.validateDbIdentifier(table);

                // Xử lý fields - có thể là string hoặc array
                let selectFields = '*';
                if (fields && fields !== '*') {
                    if (Array.isArray(fields)) {
                        // Validate each field name
                        fields.forEach(field => securityService.validateDbIdentifier(field));
                        selectFields = fields.join(', ');
                    } else if (typeof fields === 'string') {
                        // For string fields, basic validation
                        if (!/^[a-zA-Z0-9_\s,\.]+$/.test(fields)) {
                            throw new Error('Invalid field names');
                        }
                        selectFields = fields;
                    }
                }

                let sql = `SELECT ${selectFields} FROM ${table} WHERE 1=1 `;
                let paramSql = [];

                // Xử lý conditions
                if (typeof conditions === 'object' && Object.keys(conditions).length > 0) {
                    const logicalOperator = logic.toUpperCase() === 'OR' ? 'OR' : 'AND';
                    let conditionStrings = [];

                    for (let field in conditions) {
                        const value = conditions[field];
                        let condition = '';

                        if (typeof value === 'object' && value !== null && value.op) {
                            switch (value.op.toUpperCase()) {
                                case '!=':
                                    condition = `${field} != ?`;
                                    paramSql.push(value.value);
                                    break;
                                case 'IN':
                                    if (Array.isArray(value.value) && value.value.length > 0) {
                                        condition = `${field} IN (${value.value.map(() => '?').join(',')})`;
                                        paramSql.push(...value.value);
                                    }
                                    break;
                                case '>':
                                case '<':
                                case '>=':
                                case '<=':
                                    condition = `${field} ${value.op} ?`;
                                    paramSql.push(value.value);
                                    break;
                                case 'LIKE':
                                    condition = `${field} LIKE ?`;
                                    paramSql.push(value.value);
                                    break;
                                case 'IS NULL':
                                    condition = `${field} IS NULL`;
                                    break;
                                case 'IS NOT NULL':
                                    condition = `${field} IS NOT NULL`;
                                    break;
                                default:
                                    condition = `${field} = ?`;
                                    paramSql.push(value.value);
                            }
                        } else {
                            condition = `${field} = ?`;
                            paramSql.push(value);
                        }

                        if (condition) {
                            conditionStrings.push(condition);
                        }
                    }

                    if (conditionStrings.length > 0) {
                        sql += ` AND (${conditionStrings.join(` ${logicalOperator} `)})`;
                    }
                }
                // Xử lý order
                order = order.hasOwnProperty('column') && order.hasOwnProperty('type') ? order : { column: 'id', type: 'desc' };
                // Validate order column
                securityService.validateDbIdentifier(order.column);

                const orderType = order.type.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
                sql += ` ORDER BY ${order.column} ${orderType}`;
                mainService.getListTable(sql, paramSql)
                    .then(responseData => {
                        if (responseData.success && responseData.data) {
                            results.success = true;
                            if (responseData.data.length > 0) {
                                results.data = responseData.data;
                            }
                        } else {
                            results.message = responseData.message || 'Error retrieving data';
                        }
                        resolve(results);
                    })
                    .catch(error => {
                        results.message = error.message || 'Database query failed';
                        reject(results);
                    });
            } catch (error) {
                results.message = error.message || 'Invalid query parameters';
                reject(results);
            }
        });
    },
    // Middleware kiểm tra đăng nhập get - Sử dụng JWT
    isAuthenticated: async function (req, res, next) {
        if (req.user) {
            // Kiểm tra token có hợp lệ trong database không (sử dụng bảng user_sessions)
            const sessionResult = await mainService.getAllDataTable('user_sessions', {
                user_id: req.user.id,
                jwt_token_id: req.user.tokenId,
                is_active: 1
            });

            if (sessionResult.success && sessionResult.data && sessionResult.data.length > 0) {
                const session = sessionResult.data[0];

                // Kiểm tra session có hết hạn không
                const multiDeviceService = require('./multiDeviceService');
                const sessionSettings = await multiDeviceService.getUserSessionSettings(req.user.id);
                const timeoutHours = sessionSettings ? sessionSettings.session_timeout_hours : 24;
                const lastActivity = new Date(session.last_activity);
                const now = new Date();
                const hoursDiff = (now - lastActivity) / (1000 * 60 * 60);

                if (hoursDiff > timeoutHours) {
                    // Session đã hết hạn, logout
                    await multiDeviceService.logoutSession(req.user.tokenId);
                    req.app.locals.clearJWTCookie(res);
                    return res.redirect('/login?error=session_expired');
                }

                // Cập nhật thời gian hoạt động cuối cùng
                await multiDeviceService.updateLastActivity(req.user.tokenId);

                return next();
            } else {
                // Token không tồn tại trong database
                req.app.locals.clearJWTCookie(res);
                return res.redirect('/login?error=invalid_token');
            }
        }
        res.redirect('/login');
    },

    // Middleware kiểm tra đăng nhập post - Sử dụng JWT
    isAuthenticatedPost: async function (req, res, next) {
        console.log('isAuthenticatedPost', req.user);
        if (req.user) {
            // Kiểm tra token có hợp lệ trong database không (sử dụng bảng user_sessions)
            const sessionResult = await mainService.getAllDataTable('user_sessions', {
                user_id: req.user.id,
                jwt_token_id: req.user.tokenId,
                is_active: 1
            });

            if (sessionResult.success && sessionResult.data && sessionResult.data.length > 0) {
                const session = sessionResult.data[0];

                // Kiểm tra session có hết hạn không
                const multiDeviceService = require('./multiDeviceService');
                const sessionSettings = await multiDeviceService.getUserSessionSettings(req.user.id);
                const timeoutHours = sessionSettings ? sessionSettings.session_timeout_hours : 24;
                const lastActivity = new Date(session.last_activity);
                const now = new Date();
                const hoursDiff = (now - lastActivity) / (1000 * 60 * 60);

                if (hoursDiff > timeoutHours) {
                    // Session đã hết hạn, logout
                    await multiDeviceService.logoutSession(req.user.tokenId);
                    req.app.locals.clearJWTCookie(res);
                    return res.status(401).json({ result: false, message: 'Phiên đăng nhập đã hết hạn!' });
                }

                // Cập nhật thời gian hoạt động cuối cùng
                await multiDeviceService.updateLastActivity(req.user.tokenId);

                return next();
            } else {
                // Token không tồn tại trong database
                req.app.locals.clearJWTCookie(res);
                return res.status(401).json({ result: false, message: 'Phiên đăng nhập không hợp lệ!' });
            }
        }
        res.status(401).json({ result: false, message: 'Bạn cần đăng nhập để thực hiện chức năng này!' });
    },

    isAuthenticatedPostList: async function (req, res, next) {
        if (req.user) {
            // Kiểm tra token có hợp lệ trong database không (sử dụng bảng user_sessions)
            const sessionResult = await mainService.getAllDataTable('user_sessions', {
                user_id: req.user.id,
                jwt_token_id: req.user.tokenId,
                is_active: 1
            });

            if (sessionResult.success && sessionResult.data && sessionResult.data.length > 0) {
                const session = sessionResult.data[0];

                // Kiểm tra session có hết hạn không
                const multiDeviceService = require('./multiDeviceService');
                const sessionSettings = await multiDeviceService.getUserSessionSettings(req.user.id);
                const timeoutHours = sessionSettings ? sessionSettings.session_timeout_hours : 24;
                const lastActivity = new Date(session.last_activity);
                const now = new Date();
                const hoursDiff = (now - lastActivity) / (1000 * 60 * 60);

                if (hoursDiff > timeoutHours) {
                    // Session đã hết hạn, logout
                    await multiDeviceService.logoutSession(req.user.tokenId);
                    req.app.locals.clearJWTCookie(res);
                    return res.status(401).json({
                        "data": [],
                        "error": "Phiên đăng nhập đã hết hạn!",
                        "draw": req.body.draw,
                        "recordsFiltered": 0,
                        "recordsTotal": 0
                    });
                }

                // Cập nhật thời gian hoạt động cuối cùng
                await multiDeviceService.updateLastActivity(req.user.tokenId);

                return next();
            } else {
                // Token không tồn tại trong database
                req.app.locals.clearJWTCookie(res);
                return res.status(401).json({
                    "data": [],
                    "error": "Phiên đăng nhập không hợp lệ!",
                    "draw": req.body.draw,
                    "recordsFiltered": 0,
                    "recordsTotal": 0
                });
            }
        }
        res.status(401).json({
            "data": [],
            "error": "Vui lòng đăng nhập để thực hiện chức năng này!",
            "draw": req.body.draw,
            "recordsFiltered": 0,
            "recordsTotal": 0
        });
    },
    isAdmin: function (req, res, next) {
        if (req.user.isAdmin) {
            return next();
        }
        res.redirect('/');
    },
    isAdminPost: function (req, res, next) {
        if (req.user && req.user.isAdmin) {
            return next();
        }
        res.status(401).json({ result: false, message: 'Bạn cần đăng nhập để thực hiện chức năng này!' });
    },
    isAdminPostList: function (req, res, next) {
        if (req.user.isAdmin) {
            return next();
        }
        res.status(401).json({
            "data": [],
            "error": "Bạn không có quyền thực hiện chức năng này!",
            "draw": req.body.draw,
            "recordsFiltered": 0,
            "recordsTotal": 0
        });
    },
    checkAPIKey: function (req, res, next) {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey || apiKey !== process.env.API_KEY) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Invalid or missing API key'
            });
        }
        next();
    },
    countAllPatients: function (parameter) {
        var paraSQL = [];
        var sql = 'SELECT COUNT(*) AS count FROM patients WHERE active != 0 AND type = ?';
        paraSQL.push(parameter.type);
        if (parameter.search_value != "") {
            sql += " AND fullname LIKE ?";
            paraSQL.push("%" + parameter.search_value + "%");
        }
        return mainService.getListTable(sql, paraSQL);
    },
    getAllPatients: function (parameter) {
        var paraSQL = [];
        var sql = 'SELECT * FROM patients WHERE active != 0 AND type = ?';
        paraSQL.push(parameter.type);
        if (parameter.search_value != "") {
            sql += " AND fullname LIKE ?";
            paraSQL.push("%" + parameter.search_value + "%");
        }
        sql += " ORDER BY id DESC" + mainService.buildLimitClause(parameter.skip, parameter.take);
        return mainService.getListTable(sql, paraSQL)
    },
    countAllBoarding: function (parameter) {
        var paraSQL = [];
        var sql = `SELECT COUNT(*) AS count FROM ${parameter.table} WHERE active = 1 AND patient_id = ?`;
        paraSQL.push(parameter.patient_id);

        // Thêm điều kiện phân quyền: user thường chỉ xem được dữ liệu do họ tạo
        // if (parameter.user && !parameter.user.isAdmin) {
        //     sql += " AND created_by = ?";
        //     paraSQL.push(parameter.user.id);
        // }

        if (parameter.search_value != "") {
            sql += " AND bat_thuong LIKE ?";
            paraSQL.push("%" + parameter.search_value + "%");
        }
        return mainService.getListTable(sql, paraSQL);
    },
    getAllBoarding: function (parameter) {
        var paraSQL = [];
        var sql = `SELECT * FROM ${parameter.table} WHERE active = 1 AND patient_id = ?`;
        paraSQL.push(parameter.patient_id);

        // Thêm điều kiện phân quyền: user thường chỉ xem được dữ liệu do họ tạo
        // if (parameter.user && !parameter.user.isAdmin) {
        //     sql += " AND created_by = ?";
        //     paraSQL.push(parameter.user.id);
        // }

        if (parameter.search_value != "") {
            sql += " AND bat_thuong LIKE ?";
            paraSQL.push("%" + parameter.search_value + "%");
        }
        sql += " ORDER BY id DESC" + mainService.buildLimitClause(parameter.skip, parameter.take);
        return mainService.getListTable(sql, paraSQL)
    },
    // Helper function để kiểm tra quyền sở hữu dữ liệu
    // checkDataOwnership: async function(table, recordId, userId, isAdmin = false) {
    //     try {
    //         // Admin có quyền truy cập tất cả
    //         if (isAdmin) {
    //             return { hasPermission: true, message: '' };
    //         }

    //         // Kiểm tra bản ghi có tồn tại và thuộc về user không
    //         const checkResult = await this.getAllDataTable(table, { id: recordId });
    //         if (checkResult.success && checkResult.data && checkResult.data.length > 0) {
    //             const record = checkResult.data[0];
    //             if (record.created_by && record.created_by !== userId) {
    //                 return { hasPermission: false, message: 'Bạn không có quyền thao tác với dữ liệu này!' };
    //             }
    //             return { hasPermission: true, message: '' };
    //         } else {
    //             return { hasPermission: false, message: 'Không tìm thấy dữ liệu!' };
    //         }
    //     } catch (error) {
    //         return { hasPermission: false, message: 'Lỗi khi kiểm tra quyền: ' + error.message };
    //     }
    // },
    extendObject: function (out) {
        out = out || {};

        for (let i = 1; i < arguments.length; i++) {
            if (!arguments[i]) {
                continue;
            }

            for (let key in arguments[i]) {
                if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
                    out[key] = arguments[i][key];
                }
            }
        }

        return out;
    },
    checkRoleUser: function (path, user) {
        // Use the new security service for better authorization
        const authResult = securityService.checkAuthorization(user, path, 'read');

        if (!authResult.authorized) {
            return authResult.errors;
        }

        return [];
    },
    sendMessageTelegram: function (message) {
        // return;
        if (!env.parsed.TELEGRAM_BOT || !env.parsed.TELEGRAM_CHANNEL) return;
        try {
            const bot = new Telegraf(env.parsed.TELEGRAM_BOT);
            bot.telegram.sendMessage(env.parsed.TELEGRAM_CHANNEL, message)
                .catch(e => {
                    console.error("Error sending Telegram message:", e);
                });
        } catch (error) {
            console.log('sendMessageTelegram', error);
        }
    },
    countAllTable: function (parameter, filter) {
        var paraSQL = [];
        var sql = `SELECT COUNT(*) AS count FROM ? WHERE active = 1 AND patient_id = ?`;
        paraSQL.push(parameter.patient_id);
        paraSQL.push(parameter.patient_id);
        if (parameter.search_value != "") {
            sql += " AND bat_thuong LIKE ?";
            paraSQL.push("%" + parameter.search_value + "%");
        }
        return mainService.getListTable(sql, paraSQL);
    },
    getAllUser: function (parameter, filter) {
        var paraSQL = [];
        var sql = `SELECT * FROM ${parameter.table} WHERE active = 1 AND patient_id = ?`;
        paraSQL.push(parameter.patient_id);
        if (parameter.search_value != "") {
            sql += " AND bat_thuong LIKE ?";
            paraSQL.push("%" + parameter.search_value + "%");
        }
        sql += " ORDER BY id DESC" + mainService.buildLimitClause(parameter.skip, parameter.take);
        return mainService.getListTable(sql, paraSQL)
    },

    /**
     * Parse order parameters từ DataTables request body
     * @param {Object} reqBody - Request body từ DataTables
     * @param {Array} columnsMapping - Mapping giữa column index và column name
     * @param {Array} defaultOrder - Order mặc định nếu không có order từ request
     * @returns {Array} - Array các order objects
     */
    parseDataTableOrder: function (reqBody, columnsMapping, defaultOrder = []) {
        const orderFromRequest = [];
        if (reqBody.order && Array.isArray(reqBody.order)) {
            for (const orderItem of reqBody.order) {
                const columnIndex = parseInt(orderItem.column, 10);
                const direction = (orderItem.dir || 'asc').toUpperCase();

                if (
                    !isNaN(columnIndex) &&
                    columnIndex >= 0 &&
                    columnIndex < columnsMapping.length &&
                    columnsMapping[columnIndex]
                ) {
                    orderFromRequest.push({
                        column: columnsMapping[columnIndex],
                        dir: direction,
                    });
                }
            }
        }

        // Use the order from the request if available, otherwise use the default order
        return orderFromRequest.length > 0 ? orderFromRequest : defaultOrder;
    },

    /**
     * Xử lý điều kiện lọc phức tạp với hỗ trợ AND/OR
     * @param {Object|Array} filters - Cấu trúc điều kiện lọc
     * @param {Array} params - Mảng tham số SQL
     * @returns {Object} - Object chứa SQL condition và params
     */
    buildComplexFilterCondition: function (filters, params) {
        if (!filters) return { condition: '', params: [] };

        // Nếu là mảng, xử lý như một nhóm điều kiện với logic kết hợp
        if (Array.isArray(filters)) {
            const conditions = [];
            filters.forEach(filter => {
                const result = this.buildComplexFilterCondition(filter, params);
                if (result.condition) {
                    conditions.push(result.condition);
                    params.push(...result.params);
                }
            });
            return {
                condition: conditions.length > 0 ? `(${conditions.join(' AND ')})` : '',
                params: [] // params đã được push trực tiếp vào mảng đầu vào
            };
        }

        // Nếu là object đơn giản, xử lý như trước
        if (typeof filters === 'object' && !filters.logic && !filters.conditions) {
            const conditions = [];
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    conditions.push(`${key} = ?`);
                    params.push(value);
                }
            });
            return {
                condition: conditions.length > 0 ? conditions.join(' AND ') : '',
                params: [] // params đã được push trực tiếp vào mảng đầu vào
            };
        }

        // Nếu là object phức tạp với logic và conditions
        if (typeof filters === 'object' && filters.conditions) {
            const logic = filters.logic && (filters.logic.toUpperCase() === 'OR' || filters.logic.toUpperCase() === 'AND')
                ? filters.logic.toUpperCase()
                : 'AND';

            const conditions = [];
            if (Array.isArray(filters.conditions)) {
                filters.conditions.forEach(condition => {
                    const result = this.buildComplexFilterCondition(condition, params);
                    if (result.condition) {
                        conditions.push(result.condition);
                        // params đã được push trong buildComplexFilterCondition, không cần push lại
                    }
                });
            }

            return {
                condition: conditions.length > 0 ? `(${conditions.join(` ${logic} `)})` : '',
                params: [] // params đã được push trực tiếp vào mảng đầu vào
            };
        }

        return { condition: '', params: [] };
    },

    getDataTableData: async function (parameter) {
        try {
            // Validate tham số đầu vào
            if (!parameter || typeof parameter !== 'object') {
                throw new Error('Parameter must be a valid object');
            }

            if (!parameter.table) {
                throw new Error('Table name is required');
            }
            // Kiểm tra columns
            if (!Array.isArray(parameter.columns) || parameter.columns.length === 0) {
                parameter.columns = ['*'];
            }
            console.log('parameter', parameter);
            // Khởi tạo các biến cơ bản
            const paraSQL = [];
            const table = parameter.table;
            const columns = parameter.columns || ['*'];
            const primaryKey = parameter.primaryKey || 'id';

            // Xây dựng câu lệnh SQL cơ bản
            let sqlCount = `SELECT COUNT(*) AS total FROM ${table} WHERE 1=1`;
            let sqlData = `SELECT ${columns.join(', ')} FROM ${table} WHERE 1=1`;

            // Danh sách toán tử hợp lệ
            const validOperators = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN'];

            // Điều kiện mặc định cho active
            if (parameter.hasOwnProperty('active')) {
                const operator = parameter.activeOperator && validOperators.includes(parameter.activeOperator.toUpperCase())
                    ? parameter.activeOperator.toUpperCase()
                    : '='; // Mặc định là '='

                // Xử lý các toán tử khác nhau
                if (operator === 'IN' || operator === 'NOT IN') {
                    if (!Array.isArray(parameter.active)) {
                        throw new Error('Active value must be an array when using IN or NOT IN operator');
                    }
                    if (parameter.active.length === 0) {
                        throw new Error('Active array cannot be empty for IN or NOT IN operator');
                    }
                    sqlCount += ` AND active ${operator} (${parameter.active.map(() => '?').join(', ')})`;
                    sqlData += ` AND active ${operator} (${parameter.active.map(() => '?').join(', ')})`;
                    paraSQL.push(...parameter.active);
                } else {
                    sqlCount += ` AND active ${operator} ?`;
                    sqlData += ` AND active ${operator} ?`;
                    paraSQL.push(parameter.active);
                }
            } else {
                sqlCount += " AND active = 1";
                sqlData += " AND active = 1";
            }

            // Thêm điều kiện phân quyền: user thường chỉ xem được dữ liệu do họ tạo
            // if (parameter.user && !parameter.user.isAdmin) {
            //     sqlCount += " AND created_by = ?";
            //     sqlData += " AND created_by = ?";
            //     paraSQL.push(parameter.user.id);
            // }

            // Điều kiện lọc bổ sung từ parameter.filters với hỗ trợ điều kiện phức tạp
            // if (parameter.filters) {
            //     const filterResult = this.buildComplexFilterCondition(parameter.filters, filterParams);
            //     console.log('filterResult', filterResult);
            //     if (filterResult.condition) {
            //         sqlCount += ` AND ${filterResult.condition}`;
            //         sqlData += ` AND ${filterResult.condition}`;
            //     }
            // }
            const filterParams = [];
            if (parameter.filters && typeof parameter.filters === 'object') {
                Object.entries(parameter.filters).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        sqlCount += ` AND ${key} = ?`;
                        sqlData += ` AND ${key} = ?`;
                        filterParams.push(value);
                    }
                });
            }

            // Tìm kiếm toàn cục (global search)
            if (parameter.search && parameter.search.value) {
                if (typeof parameter.search.value !== 'string') {
                    throw new Error('Search value must be a string');
                }
                // const searchTerms = parameter.search.value.split(' ');
                const searchConditions = [];
                const searchColumns = parameter.search.columns || ['*'];
                searchColumns.forEach(column => {
                    // searchTerms.forEach(term => {
                    searchConditions.push(`${column} LIKE ?`);
                    filterParams.push(`%${parameter.search.value}%`);
                    // });
                });

                if (searchConditions.length > 0) {
                    const searchClause = ` AND (${searchConditions.join(' OR ')})`;
                    sqlCount += searchClause;
                    sqlData += searchClause;
                }
            }

            // Tổng số bản ghi trước khi lọc
            const totalRecordsQuery = `SELECT COUNT(*) AS total FROM ${table} WHERE 1=1` +
                (parameter.hasOwnProperty('active') ? " AND active = ?" : " AND active = 1");

            // Sắp xếp
            let orderClause = '';
            if (parameter.order && Array.isArray(parameter.order) && parameter.order.length > 0) {
                const orderParts = parameter.order.map(order => {
                    if (!order.column || !order.dir) {
                        throw new Error('Order object must have column and dir properties');
                    }

                    let columnName;

                    // Kiểm tra xem order.column là index hay column name
                    if (typeof order.column === 'number' || !isNaN(parseInt(order.column))) {
                        // Nếu là số (column index từ DataTables)
                        const columnIdx = parseInt(order.column);

                        // Xử lý trường hợp columns không có hoặc bằng []
                        if (!parameter.columns || parameter.columns.length === 0 || columnIdx >= columns.length) {
                            // Nếu không có columns hoặc columns rỗng, hoặc index vượt quá số lượng columns, sử dụng id làm mặc định
                            columnName = primaryKey;
                        } else {
                            columnName = columns[columnIdx];
                        }
                    } else {
                        // Nếu là string (column name trực tiếp từ parseDataTableOrder)
                        columnName = order.column;

                        // Validate column name để tránh SQL injection
                        securityService.validateDbIdentifier(columnName);
                    }

                    const direction = order.dir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
                    return `${columnName} ${direction}`;
                });
                orderClause = ` ORDER BY ${orderParts.join(', ')}`;
            } else {
                orderClause = ` ORDER BY ${primaryKey} DESC`;
            }
            sqlData += orderClause;

            // Phân trang
            const start = Math.max(0, parameter.start || 0); // Đảm bảo không âm
            const length = Math.min(Math.max(1, parameter.length || 10), 1000); // Giới hạn tối đa
            sqlData += mainService.buildLimitClause(start, length);

            console.log('sqlData', sqlData);
            // Thực thi truy vấn
            const [totalResult, filteredResult, dataResult] = await Promise.all([
                mainService.getListTable(totalRecordsQuery,
                    parameter.hasOwnProperty('active') ? [parameter.active] : []),
                mainService.getListTable(sqlCount, [...paraSQL, ...filterParams]),
                mainService.getListTable(sqlData, [...paraSQL, ...filterParams])
            ]);

            // Kiểm tra kết quả
            if (!totalResult || !filteredResult || !dataResult) {
                throw new Error('Database query returned invalid results');
            }

            return {
                draw: parameter.draw || 1,
                recordsTotal: totalResult.success && totalResult.data && totalResult.data.length > 0 ? totalResult.data[0].total : 0,
                recordsFiltered: filteredResult.success && filteredResult.data && filteredResult.data.length > 0 ? filteredResult.data[0].total : 0,
                data: dataResult.success && dataResult.data && dataResult.data.length > 0 ? dataResult.data : [],
                error: null
            };
        } catch (error) {
            console.error('Error in getDataTableData:', error.message);

            // Trả về response với thông tin lỗi
            return {
                draw: parameter?.draw || 1,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: [],
                error: {
                    message: error.message,
                    code: error.code || 'INTERNAL_SERVER_ERROR',
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                }
            };
        }
    },
    chatWithHugging: async function (message) {
        const response = await mainService.postApiCommon({ inputs: message }, "https://api-inference.huggingface.co/models/facebook/blenderbot-3B", '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');
        console.log('chatWithAI', message, response);
    },
    chatWithDeepAI: (message) => {
        return axios.post(
            "https://api.deepai.org/api/text-generator",
            { text: message },
            {
                headers: { "api-key": "e7224c31-0276-4222-88ba-fe96976a78b9" },
            }
        );
    },
    chatWithAI: async (prompt) => {
        try {
            const API_KEY = "37f4045b4206453d94218b11868a213b"; // Thay bằng API Key của bạn
            const BASE_URL = "https://api.aimlapi.com/v1/models/mistralai/Mistral-7B-Instruct-v0.2/completions";
            const response = await axios.post(
                BASE_URL,
                {
                    prompt: prompt,
                    max_tokens: 100, // Số token tối đa cho câu trả lời
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${API_KEY}`,
                    },
                }
            );

            console.log("Bot trả lời:", response.data);
        } catch (error) {
            console.error("Lỗi khi gọi API:", error.response ? error.response.data : error.message);
        }
    },
    chatWithAIML: async (message, model) => {
        // 'gpt-4o-mini', 'deepseek/deepseek-chat'
        const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                "Authorization": "Bearer 37f4045b4206453d94218b11868a213b",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": model ? model : "deepseek/deepseek-chat",
                "messages": [
                    {
                        "name": "text",
                        "role": "system",
                        "content": message
                    }
                ]
            })
        });

        const data = await response.json();
        return data;
    },
    chatWithOpenRouteDeepSeek: async (message) => {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: 'Bearer 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',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-r1:free',
                messages: [
                    {
                        role: 'user',
                        content: message,
                    },
                ],
            }),
        });
        const data = await response.json();
        return data;
    },
    checkValidSession: async function (req, res, next) {
        if (req.isAuthenticated()) {
            const user = await mainService.getAllDataTable('user', { id: req.user.id });

            if (user.success && user.data && user.data.length > 0) {
                const currentUser = user.data[0];

                if (currentUser.session_id && currentUser.session_id !== req.sessionID) {
                    req.logout(function (err) {
                        if (err) {
                            console.error('Logout error:', err);
                        }
                        res.redirect('/login');
                    });
                    return;
                }
            }
        }
        next();
    },
    // Hàm tính tuổi từ ngày sinh
    tinhTuoi: function (ngaySinh) {
        // Chuyển đổi ngày sinh thành Date object
        const ngaySinhDate = new Date(ngaySinh);
        const ngayHienTai = new Date();

        // Tính tuổi cơ bản
        let tuoi = ngayHienTai.getFullYear() - ngaySinhDate.getFullYear();

        // Kiểm tra xem sinh nhật năm nay đã qua chưa
        const thangSinh = ngaySinhDate.getMonth();
        const ngayTrongThangSinh = ngaySinhDate.getDate();
        const thangHienTai = ngayHienTai.getMonth();
        const ngayHienTaiTrongThang = ngayHienTai.getDate();

        // Nếu chưa đến sinh nhật năm nay thì trừ đi 1 tuổi
        if (thangHienTai < thangSinh ||
            (thangHienTai === thangSinh && ngayHienTaiTrongThang < ngayTrongThangSinh)) {
            tuoi--;
        }

        return tuoi;
    },
    // Hàm tính tuổi chi tiết (năm, tháng, ngày)
    tinhTuoiChiTiet: function (ngaySinh) {
        const ngaySinhDate = new Date(ngaySinh);
        const ngayHienTai = new Date();

        let nam = ngayHienTai.getFullYear() - ngaySinhDate.getFullYear();
        let thang = ngayHienTai.getMonth() - ngaySinhDate.getMonth();
        let ngay = ngayHienTai.getDate() - ngaySinhDate.getDate();

        // Điều chỉnh nếu ngày âm
        if (ngay < 0) {
            thang--;
            const ngayTrongThangTruoc = new Date(ngayHienTai.getFullYear(), ngayHienTai.getMonth(), 0).getDate();
            ngay += ngayTrongThangTruoc;
        }

        // Điều chỉnh nếu tháng âm
        if (thang < 0) {
            nam--;
            thang += 12;
        }

        return {
            nam: nam,
            thang: thang,
            ngay: ngay,
            chuoiMoTa: `${nam} năm, ${thang} tháng, ${ngay} ngày`,
            chuoiMoTaNgan: nam > 3 ? `${nam} tuổi` : (nam > 1 ? `${nam} tuổi ${thang} tháng` : (nam === 1 ? `${nam} tuổi ${thang} tháng` : `${thang} tháng`))
        };
    },
    saveLog: function (req, message, full_message = '') {
        try {
            // Kiểm tra req có tồn tại không
            if (!req) {
                console.log('saveLog: req is undefined');
                return;
            }

            let user = req.user || {};
            let data = {
                user_id: user.id || null,
                name: user.name || null,
                message: message || '',
                full_message: full_message || '',
                url: req.originalUrl || '',
                method: req.method || '',
                ip: req.ip || '',
                agent: (req.headers && req.headers['user-agent']) || 'Unknown',
                form_data: req.body ? JSON.stringify(req.body) : '{}'
            }
            mainService.addRecordTable(data, 'log_activities', true);
        } catch (e) {
            console.log('saveLog error:', e.message);
        }
    },
    // Helper function để lấy dữ liệu cơ bản của bệnh nhân
    getBasicPatientData: function (patient) {
        return {
            // PHẦN A - THÔNG TIN CHUNG
            id: patient.id,
            hoten: patient.fullname,
            mabenhan: patient.ma_benh_an,
            ngaydieutra: patient.ngay_dieu_tra ? moment(patient.ngay_dieu_tra).format('DD/MM/YYYY') : '',
            sophong: patient.phong_dieu_tri,
            dienthoai: patient.phone,
            ngaysinh: patient.birthday ? moment(patient.birthday).format('DD/MM/YYYY') : '',
            sex: patient.gender, // 1: Nam, 0: Nữ
            dantoc: patient.dan_toc,
            dantockhac: patient.dan_toc_khac,
            hocvan: patient.trinh_do,
            nghenghiep: patient.nghe_nghiep,
            nghenghiepkhac: patient.nghe_nghiep_khac,
            noio: patient.noi_o,
            quequan: patient.que_quan,
            xeploai_kinhte: patient.xep_loai_kt,
            chuandoan: patient.chuan_doan,
            khoa: patient.khoa,
            moiquanhe: patient.moi_quan_he,
            nguoidieutra: patient.dieu_tra_vien,
            tiensubenh: patient.tien_su_benh,
            cannang: patient.cn,
            chieucao: patient.cc,
            bienban: patient.bien_ban,
            khancap: patient.khan_cap,
            ngayhoichan: patient.ngay_hoi_chan ? moment(patient.ngay_hoi_chan).format('DD/MM/YYYY') : '',
            ngaynhapvien: patient.ngay_nhap_vien && moment(patient.ngay_nhap_vien).format('DD/MM/YYYY') !== 'Invalid date' ? moment(patient.ngay_nhap_vien).format('DD/MM/YYYY') : '',
        };
    }
}

module.exports = mainService;
