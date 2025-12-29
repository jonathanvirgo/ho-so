var express             = require('express');
var router              = express.Router();
const commonService     = require("../services/commonService");
const adminCtr          = require('../controllers/adminController');
const dishCtr           = require('../controllers/dishController');
const foodRationCtr     = require('../controllers/foodRationController');

/* GET admin home page. */
router.get("/", commonService.isAuthenticated, adminCtr.index);
// User
router.get('/user', commonService.isAuthenticated, commonService.isAdmin, adminCtr.user);

router.post('/user/list', commonService.isAuthenticatedPostList, commonService.isAdminPostList, adminCtr.userList);
router.post('/user/upsert/', commonService.isAdminPost, commonService.isAdmin, adminCtr.userUpsert);
router.post('/user/delete/:id', commonService.isAdminPost, commonService.isAdmin, adminCtr.userDelete);

// Campaign
router.get('/campaign', commonService.isAuthenticated, commonService.isAdmin, adminCtr.campaign);
router.post('/campaign/list', commonService.isAuthenticatedPostList, commonService.isAdminPostList, adminCtr.campaignList);
router.post('/campaign/upsert/', commonService.isAdminPost, commonService.isAdmin, adminCtr.campaignUpsert);
router.post('/campaign/delete/:id', commonService.isAdminPost, commonService.isAdmin, adminCtr.campaignDelete);
router.get('/campaign/options', commonService.isAuthenticated, commonService.isAdmin, adminCtr.getCampaignOptions);
router.post('/campaign/switch', commonService.isAuthenticatedPost, commonService.isAdmin, adminCtr.switchCampaign);

// Thực đơn mẫu
router.get('/thuc-don-mau', commonService.isAuthenticated, commonService.isAdmin, adminCtr.menuExampleList);
router.get('/thuc-don-mau/:id', commonService.isAuthenticated, commonService.isAdmin, adminCtr.menuExampleDetail);
router.post('/thuc-don-mau/list', commonService.isAuthenticatedPostList, commonService.isAdminPostList, adminCtr.menuExampleListData);
router.post('/thuc-don-mau/upsert/', commonService.isAdminPost, commonService.isAdmin, adminCtr.menuExampleUpsert);
router.post('/thuc-don-mau/delete/:id', commonService.isAdminPost, commonService.isAdmin, adminCtr.menuExampleDelete);

// Thực phẩm
router.get('/thuc-pham', commonService.isAuthenticated, commonService.isAdmin, adminCtr.foodList);
router.get('/thuc-pham/:id', commonService.isAuthenticated, commonService.isAdmin, adminCtr.foodDetail);
router.post('/thuc-pham/list', commonService.isAuthenticatedPostList, commonService.isAdminPostList, adminCtr.foodListData);
router.post('/thuc-pham/upsert/', commonService.isAdminPost, commonService.isAdmin, adminCtr.foodUpsert);
router.post('/thuc-pham/delete/:id', commonService.isAdminPost, commonService.isAdmin, adminCtr.foodDelete);

// Món ăn
router.get('/mon-an', commonService.isAuthenticated, dishCtr.list);
router.get('/mon-an/:id', commonService.isAuthenticated, dishCtr.detail);
router.post('/mon-an/list', commonService.isAuthenticatedPostList, dishCtr.listData);
router.post('/mon-an/upsert/', commonService.isAuthenticatedPost,  dishCtr.upsert);
router.post('/mon-an/delete/:id', commonService.isAuthenticatedPost, dishCtr.delete);
router.get('/api/dishes-for-select', commonService.isAuthenticated, dishCtr.getDishesForSelect);
router.get('/api/dish-foods/:id', commonService.isAuthenticated, dishCtr.getDishFoods);
router.get('/api/search-dishes', commonService.isAuthenticated, dishCtr.searchDishesByName);

// API để lấy thông tin thực phẩm cho admin (dùng chung với khau-phan-an)

router.get('/food-name', commonService.isAuthenticated, commonService.isAdmin, foodRationCtr.foodName);

router.post('/data-table', commonService.isAuthenticatedPost, commonService.isAdminPost, adminCtr.getDataEditTable);

// Log Management
router.get('/logs', commonService.isAuthenticated, commonService.isAdmin, adminCtr.logs);
router.post('/logs/audit/list', commonService.isAuthenticatedPostList, commonService.isAdminPostList, adminCtr.auditLogsList);
router.post('/logs/auth/list', commonService.isAuthenticatedPostList, commonService.isAdminPostList, adminCtr.authLogsList);
router.post('/logs/activity/list', commonService.isAuthenticatedPostList, commonService.isAdminPostList, adminCtr.activityLogsList);
router.post('/logs/audit/delete/:id', commonService.isAdminPost, commonService.isAdmin, adminCtr.deleteAuditLog);
router.post('/logs/auth/delete/:id', commonService.isAdminPost, commonService.isAdmin, adminCtr.deleteAuthLog);
router.post('/logs/activity/delete/:id', commonService.isAdminPost, commonService.isAdmin, adminCtr.deleteActivityLog);
router.post('/logs/audit/clear-all', commonService.isAdminPost, commonService.isAdmin, adminCtr.clearAllAuditLogs);
router.post('/logs/auth/clear-all', commonService.isAdminPost, commonService.isAdmin, adminCtr.clearAllAuthLogs);
router.post('/logs/activity/clear-all', commonService.isAdminPost, commonService.isAdmin, adminCtr.clearAllActivityLogs);

module.exports = router;
