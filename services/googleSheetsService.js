const { JWT } = require('google-auth-library');
const { google } = require('googleapis');

const googleSheetsService = {
    /**
     * Tạo service account JWT để authenticate với Google Sheets API
     * @returns {JWT} - JWT service account
     */
    createServiceAccountAuth: () => {
        try {
            // Cấu hình service account từ environment variables
            const serviceAccountAuth = new JWT({
                email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                scopes: [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive.file'
                ]
            });
            
            return serviceAccountAuth;
        } catch (error) {
            console.error('Error creating service account auth:', error);
            throw new Error('Failed to create Google Sheets authentication');
        }
    },

    /**
     * Tạo Google Sheet mới cho dự án
     * @param {string} projectName - Tên dự án
     * @param {Array} headers - Mảng các header columns
     * @returns {Object} - {sheetId, sheetUrl}
     */
    createNewSheet: async (projectName, headers = []) => {
        try {
            // Kiểm tra credentials trước
            if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
                console.warn('Google Sheets credentials not configured, skipping sheet creation');
                return {
                    sheetId: null,
                    sheetUrl: null
                };
            }

            const serviceAccountAuth = googleSheetsService.createServiceAccountAuth();

            // Sử dụng Google Sheets API trực tiếp
            const sheets = google.sheets({ version: 'v4', auth: serviceAccountAuth });
            const drive = google.drive({ version: 'v3', auth: serviceAccountAuth });

            // Tạo spreadsheet mới
            const createResponse = await sheets.spreadsheets.create({
                resource: {
                    properties: {
                        title: `Khảo sát - ${projectName} - ${new Date().toISOString().split('T')[0]}`
                    },
                    sheets: [{
                        properties: {
                            title: 'Dữ liệu khảo sát'
                        }
                    }]
                }
            });

            const spreadsheetId = createResponse.data.spreadsheetId;
            const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

            // ✅ FIX: Chia sẻ quyền xem cho bất kỳ ai có link
            // Điều này cho phép người dùng xem sheet mà không cần thêm email cụ thể
            try {
                await drive.permissions.create({
                    fileId: spreadsheetId,
                    requestBody: {
                        role: 'reader',
                        type: 'anyone'
                    }
                });
                console.log('✓ Sheet permissions set to "anyone with link can view"');
            } catch (permError) {
                console.warn('Warning: Could not set sheet permissions:', permError.message);
            }

            // Thêm headers nếu có
            if (headers && headers.length > 0) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: 'A1',
                    valueInputOption: 'RAW',
                    resource: {
                        values: [headers]
                    }
                });
            }

            console.log(`✓ Google Sheet created successfully: ${spreadsheetUrl}`);

            return {
                sheetId: spreadsheetId,
                sheetUrl: spreadsheetUrl
            };
        } catch (error) {
            console.error('Error creating new sheet:', error);
            // Không throw error để không block việc tạo project
            console.warn('Continuing without Google Sheet creation');
            return {
                sheetId: null,
                sheetUrl: null
            };
        }
    },

    /**
     * Thêm dữ liệu vào Google Sheet
     * @param {string} sheetId - ID của Google Sheet
     * @param {Object} rowData - Dữ liệu dòng cần thêm
     * @param {Array} headers - Mảng headers để map dữ liệu (KHÔNG bao gồm 'Thời gian gửi')
     * @returns {Object} - {success, rowIndex}
     */
    appendRowToSheet: async (sheetId, rowData, headers = []) => {
        try {
            // Kiểm tra credentials
            if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
                console.warn('Google Sheets credentials not configured');
                return { success: false, error: 'Credentials not configured' };
            }

            if (!sheetId) {
                console.warn('No sheet ID provided');
                return { success: false, error: 'No sheet ID' };
            }

            // ✅ FIX: Validate headers
            if (!Array.isArray(headers) || headers.length === 0) {
                console.warn('Invalid headers array');
                return { success: false, error: 'Invalid headers' };
            }

            const serviceAccountAuth = googleSheetsService.createServiceAccountAuth();
            const sheets = google.sheets({ version: 'v4', auth: serviceAccountAuth });

            // Chuẩn bị dữ liệu theo thứ tự headers
            const rowValues = [];
            headers.forEach(header => {
                // ✅ FIX: Xử lý giá trị undefined/null tốt hơn
                const value = rowData[header];
                rowValues.push(value !== undefined && value !== null ? value : '');
            });

            // ✅ FIX: Thêm timestamp - chỉ khi header có 'Thời gian gửi'
            // Headers từ updateSheetHeaders đã bao gồm 'Thời gian gửi'
            // Nếu headers được truyền vào đã có 'Thời gian gửi', rowData cũng phải có
            // Nếu chưa có trong rowData, thêm timestamp hiện tại
            if (headers.includes('Thời gian gửi') && !rowData['Thời gian gửi']) {
                rowValues[headers.indexOf('Thời gian gửi')] = new Date().toLocaleString('vi-VN');
            }

            // Thêm dòng mới bằng append API
            const appendResponse = await sheets.spreadsheets.values.append({
                spreadsheetId: sheetId,
                range: 'A:A', // Append to first available row
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [rowValues]
                }
            });

            console.log(`✓ Data appended to Google Sheet: ${sheetId}`);

            return {
                success: true,
                rowIndex: appendResponse.data.updates?.updatedRows || 1
            };
        } catch (error) {
            console.error('Error appending row to sheet:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Cập nhật headers của Google Sheet dựa trên cấu hình khảo sát
     * @param {string} sheetId - ID của Google Sheet
     * @param {Array} surveyFields - Mảng các trường khảo sát
     * @returns {Array} - Mảng headers đã cập nhật
     */
    updateSheetHeaders: async (sheetId, surveyFields) => {
        try {
            // Kiểm tra credentials
            if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
                console.warn('Google Sheets credentials not configured');
                return [];
            }

            if (!sheetId) {
                console.warn('No sheet ID provided for header update');
                return [];
            }

            // ✅ FIX: Validate surveyFields
            if (!Array.isArray(surveyFields)) {
                console.warn('Invalid surveyFields array');
                return [];
            }

            const serviceAccountAuth = googleSheetsService.createServiceAccountAuth();
            const sheets = google.sheets({ version: 'v4', auth: serviceAccountAuth });

            // Tạo headers từ survey fields
            const headers = ['ID', 'Email người trả lời', 'IP Address'];

            surveyFields.forEach(field => {
                if (field && field.field_label) {
                    headers.push(field.field_label);
                }
            });

            headers.push('Thời gian gửi');

            // Cập nhật headers bằng API
            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: 'A1',
                valueInputOption: 'RAW',
                resource: {
                    values: [headers]
                }
            });

            console.log(`✓ Google Sheet headers updated for sheet: ${sheetId}`);

            return headers;
        } catch (error) {
            console.error('Error updating sheet headers:', error);
            return [];
        }
    },

    /**
     * Lấy thông tin Google Sheet
     * @param {string} sheetId - ID của Google Sheet
     * @returns {Object} - Thông tin sheet
     */
    getSheetInfo: async (sheetId) => {
        try {
            // ✅ FIX: Validate sheetId
            if (!sheetId) {
                throw new Error('Sheet ID is required');
            }

            const serviceAccountAuth = googleSheetsService.createServiceAccountAuth();
            const sheets = google.sheets({ version: 'v4', auth: serviceAccountAuth });

            const response = await sheets.spreadsheets.get({
                spreadsheetId: sheetId
            });

            const spreadsheet = response.data;

            return {
                title: spreadsheet.properties.title,
                sheetCount: spreadsheet.sheets.length,
                url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
                lastUpdated: spreadsheet.properties.timeZone
            };
        } catch (error) {
            console.error('Error getting sheet info:', error);
            throw new Error(`Failed to get Google Sheet information: ${error.message}`);
        }
    },

    /**
     * Kiểm tra quyền truy cập Google Sheet
     * @param {string} sheetId - ID của Google Sheet
     * @returns {boolean} - true nếu có quyền truy cập
     */
    checkSheetAccess: async (sheetId) => {
        try {
            await googleSheetsService.getSheetInfo(sheetId);
            return true;
        } catch (error) {
            console.error('Sheet access check failed:', error.message);
            return false;
        }
    },

    /**
     * Tạo dữ liệu dòng từ survey response
     * @param {Object} surveyResponse - Dữ liệu phản hồi khảo sát
     * @param {Array} surveyFields - Mảng các trường khảo sát
     * @param {Array} responseData - Dữ liệu chi tiết phản hồi
     * @returns {Object} - Dữ liệu dòng để ghi vào Google Sheet
     */
    prepareSurveyDataForSheet: (surveyResponse, surveyFields, responseData) => {
        // ✅ FIX: Validate inputs
        if (!surveyResponse || !Array.isArray(surveyFields) || !Array.isArray(responseData)) {
            console.error('Invalid input for prepareSurveyDataForSheet');
            return {};
        }

        const rowData = {
            'ID': surveyResponse.id || '',
            'Email người trả lời': surveyResponse.respondent_email || '',
            'IP Address': surveyResponse.respondent_ip || ''
        };
        
        // Map dữ liệu phản hồi theo từng field
        surveyFields.forEach(field => {
            if (!field || !field.id || !field.field_label) {
                return; // Skip invalid fields
            }

            const fieldResponse = responseData.find(data => data.survey_field_id === field.id);
            
            if (fieldResponse) {
                let value = fieldResponse.field_value;
                
                // Xử lý dữ liệu JSON cho multiselect, checkbox
                if (fieldResponse.field_value_json && 
                    ['multiselect', 'checkbox'].includes(field.field_type)) {
                    try {
                        const jsonValue = JSON.parse(fieldResponse.field_value_json);
                        value = Array.isArray(jsonValue) ? jsonValue.join(', ') : value;
                    } catch (e) {
                        console.warn(`Failed to parse JSON for field ${field.field_label}:`, e);
                        // Giữ nguyên value nếu parse JSON thất bại
                    }
                }
                
                rowData[field.field_label] = value || '';
            } else {
                rowData[field.field_label] = '';
            }
        });

        // ✅ FIX: Thêm timestamp vào rowData
        rowData['Thời gian gửi'] = surveyResponse.submitted_at 
            ? new Date(surveyResponse.submitted_at).toLocaleString('vi-VN')
            : new Date().toLocaleString('vi-VN');
        
        return rowData;
    }
};

module.exports = googleSheetsService;