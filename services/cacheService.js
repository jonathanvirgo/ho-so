const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // Cache trong 5 phút

const cacheService = {
    getUserById: async function(id, fetchCallback) {
        const cacheKey = `user_${id}`;
        let userData = cache.get(cacheKey);
        
        if (userData) {
            return userData;
        }

        userData = await fetchCallback();
        if (userData) {
            cache.set(cacheKey, userData);
        }
        return userData;
    },

    invalidateUser: function(id) {
        const cacheKey = `user_${id}`;
        cache.del(cacheKey);
    }
};

module.exports = cacheService;