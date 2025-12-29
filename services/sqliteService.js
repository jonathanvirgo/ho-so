const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const sqliteService = {
    /**
     * Tạo database SQLite cho project
     * @param {string} projectName - Tên project
     * @param {number} projectId - ID project
     * @returns {string} - Đường dẫn file SQLite
     */
    createProjectDatabase: (projectName, projectId) => {
        try {
            // Tạo thư mục sqlite nếu chưa có
            const sqliteDir = path.join(__dirname, '../storage/sqlite');
            if (!fs.existsSync(sqliteDir)) {
                fs.mkdirSync(sqliteDir, { recursive: true });
            }
            
            // Tạo tên file với timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const safeName = projectName.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `${safeName}_${projectId}_${timestamp}.db`;
            const filePath = path.join(sqliteDir, fileName);
            
            // Tạo database và bảng
            const db = new sqlite3.Database(filePath);
            
            db.serialize(() => {
                // Tạo bảng survey_responses
                db.run(`
                    CREATE TABLE IF NOT EXISTS survey_responses (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        survey_config_id INTEGER,
                        respondent_email TEXT,
                        respondent_ip TEXT,
                        user_agent TEXT,
                        session_id TEXT,
                        is_completed INTEGER DEFAULT 1,
                        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        metadata TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                // Tạo bảng survey_response_data
                db.run(`
                    CREATE TABLE IF NOT EXISTS survey_response_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        survey_response_id INTEGER,
                        survey_field_id INTEGER,
                        field_name TEXT,
                        field_value TEXT,
                        field_value_json TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (survey_response_id) REFERENCES survey_responses(id)
                    )
                `);
                
                // Tạo bảng project_info để lưu thông tin project
                db.run(`
                    CREATE TABLE IF NOT EXISTS project_info (
                        id INTEGER PRIMARY KEY,
                        project_id INTEGER,
                        project_name TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                // Insert thông tin project
                db.run(`
                    INSERT INTO project_info (project_id, project_name) 
                    VALUES (?, ?)
                `, [projectId, projectName]);
            });
            
            db.close();
            
            console.log(`✓ SQLite database created: ${fileName}`);
            return filePath;
            
        } catch (error) {
            console.error('Error creating SQLite database:', error);
            return null;
        }
    },

    /**
     * Lưu survey response vào SQLite
     * @param {string} dbPath - Đường dẫn file SQLite
     * @param {Object} responseData - Dữ liệu response
     * @param {Array} responseDetails - Chi tiết response
     */
    saveSurveyResponse: async (dbPath, responseData, responseDetails) => {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(dbPath)) {
                reject(new Error('SQLite database file not found'));
                return;
            }

            const db = new sqlite3.Database(dbPath);

            db.serialize(() => {
                // Insert survey response
                db.run(`
                    INSERT INTO survey_responses
                    (survey_config_id, respondent_email, respondent_ip, user_agent, session_id, is_completed, submitted_at, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    responseData.survey_config_id,
                    responseData.respondent_email,
                    responseData.respondent_ip,
                    responseData.user_agent,
                    responseData.session_id,
                    responseData.is_completed,
                    responseData.submitted_at,
                    responseData.metadata
                ], function(err) {
                    if (err) {
                        db.close();
                        reject(err);
                        return;
                    }

                    const responseId = this.lastID;

                    // Insert response details
                    if (responseDetails.length === 0) {
                        db.close();
                        resolve(responseId);
                        return;
                    }

                    let completed = 0;
                    const total = responseDetails.length;
                    let hasError = false;

                    responseDetails.forEach(detail => {
                        if (hasError) return;

                        db.run(`
                            INSERT INTO survey_response_data
                            (survey_response_id, survey_field_id, field_name, field_value, field_value_json)
                            VALUES (?, ?, ?, ?, ?)
                        `, [
                            responseId,
                            detail.survey_field_id,
                            detail.field_name,
                            detail.field_value,
                            detail.field_value_json
                        ], function(err) {
                            if (hasError) return;

                            completed++;

                            if (err) {
                                hasError = true;
                                db.close();
                                reject(err);
                                return;
                            }

                            if (completed === total) {
                                db.close();
                                resolve(responseId);
                            }
                        });
                    });
                });
            });
        });
    },

    /**
     * Lấy danh sách responses từ SQLite
     * @param {string} dbPath - Đường dẫn file SQLite
     * @param {Object} filters - Bộ lọc
     * @returns {Array} - Danh sách responses
     */
    getSurveyResponses: async (dbPath, filters = {}) => {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(dbPath)) {
                reject(new Error('SQLite database file not found'));
                return;
            }

            const db = new sqlite3.Database(dbPath);

            let query = `
                SELECT
                    sr.*,
                    GROUP_CONCAT(srd.field_name || ': ' || srd.field_value, ' | ') as response_data
                FROM survey_responses sr
                LEFT JOIN survey_response_data srd ON sr.id = srd.survey_response_id
                WHERE 1=1
            `;

            const params = [];

            if (filters.survey_config_id) {
                query += ' AND sr.survey_config_id = ?';
                params.push(filters.survey_config_id);
            }

            if (filters.email) {
                query += ' AND sr.respondent_email LIKE ?';
                params.push(`%${filters.email}%`);
            }

            if (filters.date_from) {
                query += ' AND DATE(sr.submitted_at) >= ?';
                params.push(filters.date_from);
            }

            if (filters.date_to) {
                query += ' AND DATE(sr.submitted_at) <= ?';
                params.push(filters.date_to);
            }

            query += ' GROUP BY sr.id ORDER BY sr.submitted_at DESC';

            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(filters.limit);
            }

            db.all(query, params, (err, rows) => {
                db.close();

                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    /**
     * Lấy danh sách responses với dữ liệu fields riêng biệt
     * @param {string} dbPath - Đường dẫn file SQLite
     * @param {Object} filters - Bộ lọc
     * @param {Array} surveyFields - Danh sách fields của survey
     * @returns {Array} - Danh sách responses với field data
     */
    getSurveyResponsesWithFields: async (dbPath, filters = {}, surveyFields = []) => {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(dbPath)) {
                reject(new Error('SQLite database file not found'));
                return;
            }

            const db = new sqlite3.Database(dbPath);

            let query = `
                SELECT sr.*
                FROM survey_responses sr
                WHERE 1=1
            `;

            const params = [];

            if (filters.survey_config_id) {
                query += ' AND sr.survey_config_id = ?';
                params.push(filters.survey_config_id);
            }

            if (filters.email) {
                query += ' AND sr.respondent_email LIKE ?';
                params.push(`%${filters.email}%`);
            }

            if (filters.date_from) {
                query += ' AND DATE(sr.submitted_at) >= ?';
                params.push(filters.date_from);
            }

            if (filters.date_to) {
                query += ' AND DATE(sr.submitted_at) <= ?';
                params.push(filters.date_to);
            }

            query += ' ORDER BY sr.submitted_at DESC';

            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(filters.limit);
            }

            db.all(query, params, (err, responses) => {
                if (err) {
                    db.close();
                    reject(err);
                    return;
                }

                if (responses.length === 0) {
                    db.close();
                    resolve([]);
                    return;
                }

                // Lấy dữ liệu chi tiết cho tất cả responses
                const responseIds = responses.map(r => r.id);
                const placeholders = responseIds.map(() => '?').join(',');

                const detailQuery = `
                    SELECT
                        srd.survey_response_id,
                        srd.field_name,
                        srd.field_value,
                        srd.field_value_json
                    FROM survey_response_data srd
                    WHERE srd.survey_response_id IN (${placeholders})
                `;

                db.all(detailQuery, responseIds, (err, details) => {
                    db.close();

                    if (err) {
                        reject(err);
                        return;
                    }

                    // Gộp dữ liệu
                    const responseMap = {};
                    responses.forEach(response => {
                        responseMap[response.id] = {
                            ...response,
                            field_data: {}
                        };
                    });

                    details.forEach(detail => {
                        if (responseMap[detail.survey_response_id]) {
                            responseMap[detail.survey_response_id].field_data[detail.field_name] = {
                                field_value: detail.field_value,
                                field_value_json: detail.field_value_json
                            };
                        }
                    });

                    resolve(Object.values(responseMap));
                });
            });
        });
    },

    /**
     * Lấy chi tiết response từ SQLite
     * @param {string} dbPath - Đường dẫn file SQLite
     * @param {number} responseId - ID response
     * @returns {Object} - Chi tiết response
     */
    getSurveyResponseDetail: async (dbPath, responseId) => {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(dbPath)) {
                reject(new Error('SQLite database file not found'));
                return;
            }
            
            const db = new sqlite3.Database(dbPath);
            
            // Lấy thông tin response
            db.get(`
                SELECT * FROM survey_responses WHERE id = ?
            `, [responseId], (err, response) => {
                if (err) {
                    db.close();
                    reject(err);
                    return;
                }
                
                if (!response) {
                    db.close();
                    resolve(null);
                    return;
                }
                
                // Lấy chi tiết response data
                db.all(`
                    SELECT * FROM survey_response_data 
                    WHERE survey_response_id = ? 
                    ORDER BY id
                `, [responseId], (err, details) => {
                    db.close();
                    
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            response: response,
                            details: details
                        });
                    }
                });
            });
        });
    },

    /**
     * Cập nhật response trong SQLite
     * @param {string} dbPath - Đường dẫn file SQLite
     * @param {number} responseId - ID response
     * @param {Object} updateData - Dữ liệu cập nhật
     */
    updateSurveyResponse: async (dbPath, responseId, updateData) => {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(dbPath)) {
                reject(new Error('SQLite database file not found'));
                return;
            }
            
            const db = new sqlite3.Database(dbPath);
            
            const fields = [];
            const values = [];
            
            Object.keys(updateData).forEach(key => {
                if (key !== 'details') {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });
            
            if (fields.length === 0) {
                db.close();
                resolve();
                return;
            }
            
            values.push(responseId);
            
            db.run(`
                UPDATE survey_responses 
                SET ${fields.join(', ')} 
                WHERE id = ?
            `, values, function(err) {
                if (err) {
                    db.close();
                    reject(err);
                    return;
                }
                
                // Cập nhật details nếu có
                if (updateData.details && Array.isArray(updateData.details)) {
                    // Xóa details cũ
                    db.run(`DELETE FROM survey_response_data WHERE survey_response_id = ?`, [responseId], (err) => {
                        if (err) {
                            db.close();
                            reject(err);
                            return;
                        }
                        
                        // Insert details mới
                        const stmt = db.prepare(`
                            INSERT INTO survey_response_data 
                            (survey_response_id, survey_field_id, field_name, field_value, field_value_json)
                            VALUES (?, ?, ?, ?, ?)
                        `);
                        
                        let completed = 0;
                        const total = updateData.details.length;
                        
                        if (total === 0) {
                            stmt.finalize();
                            db.close();
                            resolve();
                            return;
                        }
                        
                        updateData.details.forEach(detail => {
                            stmt.run([
                                responseId,
                                detail.survey_field_id,
                                detail.field_name,
                                detail.field_value,
                                detail.field_value_json
                            ], (err) => {
                                completed++;
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                
                                if (completed === total) {
                                    stmt.finalize();
                                    db.close();
                                    resolve();
                                }
                            });
                        });
                    });
                } else {
                    db.close();
                    resolve();
                }
            });
        });
    },

    /**
     * Cập nhật survey response
     * @param {string} dbPath - Đường dẫn file SQLite
     * @param {number} responseId - ID của response
     * @param {Object} updateData - Dữ liệu cập nhật
     * @returns {boolean} - True nếu cập nhật thành công
     */
    updateSurveyResponse: async (dbPath, responseId, updateData) => {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(dbPath)) {
                reject(new Error('SQLite database file not found'));
                return;
            }

            const db = new sqlite3.Database(dbPath);

            // Cập nhật từng field trong survey_response_data
            const updatePromises = [];

            Object.keys(updateData).forEach(fieldName => {
                if (fieldName !== 'responseId') {
                    const promise = new Promise((resolveField, rejectField) => {
                        db.run(`
                            UPDATE survey_response_data
                            SET field_value = ?, updated_at = CURRENT_TIMESTAMP
                            WHERE survey_response_id = ? AND field_name = ?
                        `, [updateData[fieldName], responseId, fieldName], function(err) {
                            if (err) {
                                rejectField(err);
                            } else {
                                resolveField(this.changes);
                            }
                        });
                    });
                    updatePromises.push(promise);
                }
            });

            Promise.all(updatePromises)
                .then(() => {
                    // Cập nhật thời gian modified của response chính
                    db.run(`
                        UPDATE survey_responses
                        SET updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [responseId], function(err) {
                        db.close();

                        if (err) {
                            reject(err);
                        } else {
                            resolve(true);
                        }
                    });
                })
                .catch(err => {
                    db.close();
                    reject(err);
                });
        });
    },

    /**
     * Xóa response từ SQLite
     * @param {string} dbPath - Đường dẫn file SQLite
     * @param {number} responseId - ID response
     */
    deleteSurveyResponse: async (dbPath, responseId) => {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(dbPath)) {
                reject(new Error('SQLite database file not found'));
                return;
            }

            const db = new sqlite3.Database(dbPath);

            db.serialize(() => {
                // Xóa response details trước
                db.run(`DELETE FROM survey_response_data WHERE survey_response_id = ?`, [responseId], (err) => {
                    if (err) {
                        db.close();
                        reject(err);
                        return;
                    }

                    // Xóa response
                    db.run(`DELETE FROM survey_responses WHERE id = ?`, [responseId], function(err) {
                        db.close();

                        if (err) {
                            reject(err);
                        } else {
                            resolve(this.changes > 0);
                        }
                    });
                });
            });
        });
    },

    /**
     * Xuất dữ liệu ra file Excel
     * @param {string} dbPath - Đường dẫn file SQLite
     * @param {Array} surveyFields - Danh sách fields của survey
     * @param {Object} filters - Bộ lọc
     * @returns {Buffer} - Buffer của file Excel
     */
    exportToExcel: async (dbPath, surveyFields = [], filters = {}) => {
        try {
            if (!fs.existsSync(dbPath)) {
                throw new Error('SQLite database file not found');
            }

            // Lấy dữ liệu từ SQLite
            const responses = await sqliteService.getSurveyResponses(dbPath, filters);

            // Tạo workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Survey Responses');

            // Tạo headers (loại bỏ email và IP address)
            const headers = ['ID'];

            // Thêm headers từ survey fields (sử dụng field_label)
            surveyFields.forEach(field => {
                headers.push(field.field_name);
            });

            // Set headers
            worksheet.addRow(headers);

            // Style headers
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            // Lấy chi tiết cho mỗi response (nếu có)
            if (responses && responses.length > 0) {
                for (const response of responses) {
                    const details = await sqliteService.getSurveyResponseDetail(dbPath, response.id);

                    const rowData = [
                        response.id
                    ];

                    // Thêm dữ liệu fields theo thứ tự
                    surveyFields.forEach(field => {
                        let value = '';

                        if (details && details.details) {
                            const fieldData = details.details.find(d => d.field_name === field.field_name);

                            if (fieldData) {
                                if (fieldData.field_value_json) {
                                    try {
                                        const jsonValue = JSON.parse(fieldData.field_value_json);
                                        value = Array.isArray(jsonValue) ? jsonValue.join(', ') : jsonValue;
                                    } catch (e) {
                                        value = fieldData.field_value || '';
                                    }
                                } else {
                                    value = fieldData.field_value || '';
                                }
                            }
                        }

                        rowData.push(value);
                    });

                    worksheet.addRow(rowData);
                }
            } else {
                // Nếu không có dữ liệu, thêm một dòng trống để file Excel không bị lỗi
                const emptyRow = ['', ''];
                surveyFields.forEach(() => {
                    emptyRow.push('');
                });
                worksheet.addRow(emptyRow);
            }

            // Auto-fit columns
            worksheet.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, (cell) => {
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                });
                column.width = Math.min(maxLength + 2, 50);
            });

            // Tạo buffer
            const buffer = await workbook.xlsx.writeBuffer();
            return buffer;

        } catch (error) {
            console.error('Error exporting to Excel:', error);
            throw error;
        }
    },

    /**
     * Lấy thống kê từ SQLite
     * @param {string} dbPath - Đường dẫn file SQLite
     * @returns {Object} - Thống kê
     */
    getStatistics: async (dbPath) => {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(dbPath)) {
                reject(new Error('SQLite database file not found'));
                return;
            }

            const db = new sqlite3.Database(dbPath);

            db.serialize(() => {
                const stats = {};

                // Tổng số responses
                db.get(`SELECT COUNT(*) as total FROM survey_responses`, (err, row) => {
                    if (err) {
                        db.close();
                        reject(err);
                        return;
                    }
                    stats.totalResponses = row.total;

                    // Responses theo ngày
                    db.all(`
                        SELECT DATE(submitted_at) as date, COUNT(*) as count
                        FROM survey_responses
                        GROUP BY DATE(submitted_at)
                        ORDER BY date DESC
                        LIMIT 30
                    `, (err, rows) => {
                        if (err) {
                            db.close();
                            reject(err);
                            return;
                        }
                        stats.responsesByDate = rows;

                        // Response đầu tiên và cuối cùng
                        db.get(`
                            SELECT
                                MIN(submitted_at) as first_response,
                                MAX(submitted_at) as last_response
                            FROM survey_responses
                        `, (err, row) => {
                            db.close();

                            if (err) {
                                reject(err);
                            } else {
                                stats.firstResponse = row.first_response;
                                stats.lastResponse = row.last_response;
                                resolve(stats);
                            }
                        });
                    });
                });
            });
        });
    },

    /**
     * Lấy đường dẫn file SQLite của project
     * @param {number} projectId - ID project
     * @returns {string|null} - Đường dẫn file SQLite
     */
    getProjectDatabasePath: (projectId) => {
        try {
            const sqliteDir = path.join(__dirname, '../storage/sqlite');
            if (!fs.existsSync(sqliteDir)) {
                return null;
            }

            const files = fs.readdirSync(sqliteDir);
            const projectFile = files.find(file =>
                file.includes(`_${projectId}_`) && file.endsWith('.db')
            );

            return projectFile ? path.join(sqliteDir, projectFile) : null;
        } catch (error) {
            console.error('Error getting project database path:', error);
            return null;
        }
    },

    /**
     * Get analytics overview data
     */
    getAnalyticsOverview: (dbPath, filters = {}) => {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath);

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (filters.surveyConfigId) {
                whereClause += ' AND survey_config_id = ?';
                params.push(filters.surveyConfigId);
            }

            if (filters.startDate) {
                whereClause += ' AND submitted_at >= ?';
                params.push(filters.startDate);
            }

            if (filters.endDate) {
                whereClause += ' AND submitted_at <= ?';
                params.push(filters.endDate);
            }

            const queries = [
                // Total responses
                `SELECT COUNT(*) as totalResponses FROM survey_responses ${whereClause}`,

                // Today's responses
                `SELECT COUNT(*) as todayResponses FROM survey_responses
                 ${whereClause} AND DATE(submitted_at) = DATE('now')`,

                // Completion rate (assuming all are completed for now)
                `SELECT
                    COUNT(*) as completed,
                    COUNT(*) as total,
                    (COUNT(*) * 100.0 / COUNT(*)) as completionRate
                 FROM survey_responses ${whereClause}`,

                // Average completion time (mock data for now)
                `SELECT AVG(225) as averageTime FROM survey_responses ${whereClause}`
            ];

            const results = {};
            let completed = 0;

            queries.forEach((query, index) => {
                db.get(query, params, (err, row) => {
                    if (err) {
                        console.error('Analytics query error:', err);
                        return;
                    }

                    switch(index) {
                        case 0:
                            results.totalResponses = row.totalResponses || 0;
                            break;
                        case 1:
                            results.todayResponses = row.todayResponses || 0;
                            break;
                        case 2:
                            results.completionRate = row.completionRate || 100;
                            break;
                        case 3:
                            results.averageTime = row.averageTime || 225;
                            break;
                    }

                    completed++;
                    if (completed === queries.length) {
                        // Calculate trend (mock for now)
                        results.responseTrend = Math.random() * 20 - 10; // -10% to +10%

                        db.close();
                        resolve(results);
                    }
                });
            });
        });
    },

    /**
     * Get response trend data
     */
    getResponseTrend: (dbPath, filters = {}) => {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath);

            let dateFormat = '%Y-%m-%d';
            let dateRange = 7;

            switch(filters.dateRange) {
                case '1d':
                    dateFormat = '%Y-%m-%d %H:00:00';
                    dateRange = 1;
                    break;
                case '30d':
                    dateRange = 30;
                    break;
                case '90d':
                    dateRange = 90;
                    break;
            }

            let whereClause = `WHERE submitted_at >= datetime('now', '-${dateRange} days')`;
            const params = [];

            if (filters.surveyConfigId) {
                whereClause += ' AND survey_config_id = ?';
                params.push(filters.surveyConfigId);
            }

            const query = `
                SELECT
                    strftime('${dateFormat}', submitted_at) as date,
                    COUNT(*) as count
                FROM survey_responses
                ${whereClause}
                GROUP BY strftime('${dateFormat}', submitted_at)
                ORDER BY date
            `;

            db.all(query, params, (err, rows) => {
                if (err) {
                    db.close();
                    return reject(err);
                }

                const labels = rows.map(row => {
                    const date = new Date(row.date);
                    if (filters.dateRange === '1d') {
                        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    }
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                });

                const values = rows.map(row => row.count);

                db.close();
                resolve({ labels, values });
            });
        });
    },

    /**
     * Get field analysis data
     */
    getFieldAnalysis: (dbPath, filters = {}) => {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath);

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (filters.surveyConfigId) {
                whereClause += ' AND srd.survey_response_id IN (SELECT id FROM survey_responses WHERE survey_config_id = ?)';
                params.push(filters.surveyConfigId);
            }

            const query = `
                SELECT
                    field_name,
                    COUNT(*) as count
                FROM survey_response_data srd
                JOIN survey_responses sr ON srd.survey_response_id = sr.id
                ${whereClause}
                GROUP BY field_name
                ORDER BY count DESC
                LIMIT 8
            `;

            db.all(query, params, (err, rows) => {
                if (err) {
                    db.close();
                    return reject(err);
                }

                const labels = rows.map(row => row.field_name);
                const values = rows.map(row => row.count);

                db.close();
                resolve({ labels, values });
            });
        });
    },

    /**
     * Get response time analysis
     */
    getResponseTimeAnalysis: (dbPath, filters = {}) => {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath);

            // Mock data for response time analysis
            const labels = [];
            const values = [];

            if (filters.period === '24h') {
                // Hourly data for last 24 hours
                for (let i = 0; i < 24; i++) {
                    labels.push(`${i}:00`);
                    values.push(Math.floor(Math.random() * 10) + 2); // 2-12 minutes
                }
            } else {
                // Daily data for last 7 days
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                    values.push(Math.floor(Math.random() * 8) + 3); // 3-11 minutes
                }
            }

            db.close();
            resolve({ labels, values });
        });
    },

    /**
     * Get recent responses
     */
    getRecentResponses: (dbPath, filters = {}) => {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath);

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (filters.surveyConfigId) {
                whereClause += ' AND survey_config_id = ?';
                params.push(filters.surveyConfigId);
            }

            const query = `
                SELECT
                    respondent_email,
                    submitted_at,
                    'Survey Response' as survey_name
                FROM survey_responses
                ${whereClause}
                ORDER BY submitted_at DESC
                LIMIT ?
            `;

            params.push(filters.limit || 10);

            db.all(query, params, (err, rows) => {
                if (err) {
                    db.close();
                    return reject(err);
                }

                db.close();
                resolve(rows);
            });
        });
    },

    /**
     * Get geographic analysis data
     */
    getGeographicAnalysis: (dbPath, filters = {}) => {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath);

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (filters.surveyConfigId) {
                whereClause += ' AND srd.survey_response_id IN (SELECT id FROM survey_responses WHERE survey_config_id = ?)';
                params.push(filters.surveyConfigId);
            }

            // Tìm các trường có thể chứa thông tin địa lý
            const geographicFields = [
                'location', 'city', 'province', 'country', 'region', 'area',
                'tinh_thanh', 'thanh_pho', 'quan_huyen', 'dia_chi', 'khu_vuc'
            ];

            const fieldConditions = geographicFields.map(field => `field_name LIKE '%${field}%'`).join(' OR ');

            const query = `
                SELECT
                    field_value as location,
                    COUNT(*) as count
                FROM survey_response_data srd
                JOIN survey_responses sr ON srd.survey_response_id = sr.id
                ${whereClause}
                AND (${fieldConditions})
                AND field_value IS NOT NULL
                AND field_value != ''
                GROUP BY field_value
                ORDER BY count DESC
                LIMIT 10
            `;

            db.all(query, params, (err, rows) => {
                if (err) {
                    db.close();
                    return reject(err);
                }

                // Nếu không có dữ liệu địa lý, trả về dữ liệu trống
                if (!rows || rows.length === 0) {
                    db.close();
                    return resolve({ labels: [], values: [] });
                }

                const labels = rows.map(row => row.location);
                const values = rows.map(row => row.count);

                db.close();
                resolve({ labels, values });
            });
        });
    },

    /**
     * Export analytics to Excel
     */
    exportAnalyticsToExcel: async (dbPath, filters = {}) => {
        try {
            const workbook = new ExcelJS.Workbook();

            // Overview sheet
            const overviewSheet = workbook.addWorksheet('Overview');
            const overview = await sqliteService.getAnalyticsOverview(dbPath, filters);

            overviewSheet.addRow(['Metric', 'Value']);
            overviewSheet.addRow(['Total Responses', overview.totalResponses]);
            overviewSheet.addRow(['Today\'s Responses', overview.todayResponses]);
            overviewSheet.addRow(['Completion Rate', `${overview.completionRate}%`]);
            overviewSheet.addRow(['Average Time', `${overview.averageTime}s`]);

            // Trend sheet
            const trendSheet = workbook.addWorksheet('Response Trend');
            const trendData = await sqliteService.getResponseTrend(dbPath, filters);

            trendSheet.addRow(['Date', 'Responses']);
            trendData.labels.forEach((label, index) => {
                trendSheet.addRow([label, trendData.values[index]]);
            });

            return await workbook.xlsx.writeBuffer();
        } catch (error) {
            console.error('Error exporting analytics to Excel:', error);
            throw error;
        }
    },

    /**
     * Export analytics to PDF (placeholder)
     */
    exportAnalyticsToPDF: async (dbPath, filters = {}) => {
        // This would require a PDF library like puppeteer or jsPDF
        // For now, return a simple text buffer
        const overview = await sqliteService.getAnalyticsOverview(dbPath, filters);
        const content = `Analytics Report

Total Responses: ${overview.totalResponses}
Today's Responses: ${overview.todayResponses}
Completion Rate: ${overview.completionRate}%
Average Time: ${overview.averageTime}s`;

        return Buffer.from(content, 'utf8');
    },

    /**
     * Export analytics to CSV
     */
    exportAnalyticsToCSV: async (dbPath, filters = {}) => {
        try {
            const overview = await sqliteService.getAnalyticsOverview(dbPath, filters);
            const trendData = await sqliteService.getResponseTrend(dbPath, filters);

            let csv = 'Metric,Value\n';
            csv += `Total Responses,${overview.totalResponses}\n`;
            csv += `Today's Responses,${overview.todayResponses}\n`;
            csv += `Completion Rate,${overview.completionRate}%\n`;
            csv += `Average Time,${overview.averageTime}s\n\n`;

            csv += 'Date,Responses\n';
            trendData.labels.forEach((label, index) => {
                csv += `${label},${trendData.values[index]}\n`;
            });

            return Buffer.from(csv, 'utf8');
        } catch (error) {
            console.error('Error exporting analytics to CSV:', error);
            throw error;
        }
    }
};

module.exports = sqliteService;
