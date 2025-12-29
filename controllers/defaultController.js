var moment          = require('moment'),
    url             = require('url'),
    commonService   = require('../services/commonService'),
    securityService = require('../services/securityService'),
    env             = require('dotenv').config(),
    util            = require('util');

let patient = {
    list: function(req, res, next){
        // This appears to be a placeholder controller
        const errorResponse = securityService.createErrorResponse(
            'Chức năng này chưa được triển khai',
            null,
            501
        );
        
        if (req.method === 'POST') {
            return res.status(501).json(errorResponse);
        } else {
            return res.status(501).render('error', {
                user: req.user,
                message: 'Chức năng này chưa được triển khai',
                status: 501
            });
        }
    }
}

module.exports = patient;