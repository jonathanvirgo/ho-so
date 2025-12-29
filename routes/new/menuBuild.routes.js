var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const menuBuild = require('../controllers/menuBuildController');

// Menu Build Routes
router.get("/",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'read'),
    menuBuild.index);

router.post("/list",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('menu-build', 'read'),
    menuBuild.listData);

router.get("/create",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'create'),
    menuBuild.create);

router.get("/edit/:id",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'update'),
    menuBuild.edit);

router.get("/edit-day/:menuId/:week/:day",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'update'),
    menuBuild.editDay);

router.get("/ingredients/:menuId/:week/:day",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'read'),
    menuBuild.calculateIngredients);

router.get("/ingredients/:menuId/:week/:day/:mealTimeId",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'read'),
    menuBuild.calculateIngredientsByMealTime);

// New route for week-level ingredients calculation
router.get("/ingredients-week/:menuId/:week",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'read'),
    menuBuild.calculateWeekIngredients);

router.post("/save",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('menu-build', 'create'),
    menuBuild.save);

router.post("/delete/:id",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('menu-build', 'delete'),
    menuBuild.delete);

module.exports = router;
