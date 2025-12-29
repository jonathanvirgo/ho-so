const commonService = require('./commonService');
const cacheService = require('./cacheService');

const userService = {
    async getUserDetails(id) {
        return await cacheService.getUserById(id, async () => {
            const [userResponse, roleResponse] = await Promise.all([
                commonService.getAllDataTable('user', {id: id}),
                commonService.getAllDataTable('role_user', {user_id: id})
            ]);

            if (!userResponse.success || !userResponse.data || userResponse.data.length === 0) {
                return null;
            }

            const user = userResponse.data[0];
            const detailUser = {
                id: user.id,
                email: user.email,
                fullname: user.fullname,
                active: user.active,
                jwt_token_id: user.jwt_token_id,
                device_info: user.device_info ? JSON.parse(user.device_info) : null,
                token_created_at: user.token_created_at,
                role_id: [],
                isAdmin: false,
                campaign_id: user.campaign_id
            };

            if (roleResponse.success && roleResponse.data) {
                for (let item of roleResponse.data) {
                    detailUser.role_id.push(item.role_id);
                    if (item.role_id == 1) {
                        detailUser.isAdmin = true;
                    }
                }
            }
            return detailUser;
        });
    }
};

module.exports = userService;