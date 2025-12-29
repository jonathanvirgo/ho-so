var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const foodRation = require('../controllers/foodRationController');

// Food Ration (Khẩu phần ăn)
router.get("/detail/:patient_id",
    commonService.isAuthenticated, 
    securityService.requirePermission('khau-phan-an', 'read'),
    foodRation.index);

router.get("/food-name", 
    commonService.isAuthenticated, 
    securityService.requirePermission('khau-phan-an', 'read'), 
    foodRation.foodName);

router.post("/save-menu", commonService.isAuthenticatedPost, foodRation.saveMenu);

module.exports = router;
