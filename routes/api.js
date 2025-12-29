var express             = require('express');
var importFoodController = require('../controllers/importFoodController');
var router              = express.Router();
const commonService     = require("../services/commonService");
const catGanNho         = require("../database/cat-gan-nho.json");
const uonVanKpa         = require("../database/uon-van-kpa.json");

// API để lấy dữ liệu cat-gan-nho
// router.post('/update-time-cat-gan-nho', async (req, res) => {
//     const data = req.body;
//     if(data.key && data.key == 'Vnpt@12345'){
//         try {
//             for (let i = 0; i < catGanNho.length; i++) {
//                 const element = catGanNho[i];
//                 await commonService.updateRecordTable({time: element.time}, { id: element.id }, 'cat_gan_nho_kpa');
//             }
//             return res.json({ success: true, message: 'Cập nhật thành công!' });
//         } catch (error) {
//             console.log('error', error);
//             return res.json({ success: false, message: 'Có lỗi xảy ra: ' + error.message });
//         }
//     }else{
//         return res.json({ success: false, message: 'Không có quyền truy cập!' });
//     }
// });

// router.post('/update-time-uon-van', async (req, res) => {
//     const data = req.body;
//     if(data.key && data.key == 'Vnpt@12345'){
//         try {
//             for (let i = 0; i < uonVanKpa.length; i++) {
//                 const element = uonVanKpa[i];
//                 await commonService.updateRecordTable({time: element.time}, { id: element.id }, 'uon_van_kpa');
//             }
//             return res.json({ success: true, message: 'Cập nhật thành công!' });
//         } catch (error) {
//             console.log('error', error);
//             return res.json({ success: false, message: 'Có lỗi xảy ra: ' + error.message });
//         }
//     }else{
//         return res.json({ success: false, message: 'Không có quyền truy cập!' });
//     }
// });


module.exports = router;
