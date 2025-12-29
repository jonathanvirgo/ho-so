const  commonService   = require('../services/commonService');
module.exports = {
    index: (req, res) => {
        // Kiểm tra user có tồn tại và có role_id không
        if (!req.user || !req.user.role_id || !Array.isArray(req.user.role_id)) {
            return res.redirect('/login');
        }

        switch(true){
            case req.user.role_id.includes(1):
                return res.render('index', {user: req.user});
            case req.user.role_id.includes(3):
                return res.redirect('/viem-gan');
            case req.user.role_id.includes(4):
                return res.redirect('/uon-van');
            case req.user.role_id.includes(5):
                return res.redirect('/hoi-chan');
            case req.user.role_id.includes(6):
                return res.redirect('/viem-gan-mt1');
            case req.user.role_id.includes(7):
                return res.redirect('/research');
            case req.user.role_id.includes(8):
                return res.redirect('/standard');
            default:
                return res.redirect('/');
        }
    },
    chat: async (req, res) =>{
        const responseData = await commonService.chatWithAIML(req.body.message, 'gpt-4o-mini');
        res.json(responseData);
    },
    chatopenroute: async (req, res) =>{
        const responseData = await commonService.chatWithOpenRouteDeepSeek(req.body.message);
        res.json(responseData);
    }
};