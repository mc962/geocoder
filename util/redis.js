const { promisify } = require('util');
const redisClient = require('redis').createClient(process.env.REDIS_URL);

exports.rGetAsync = promisify(client.get).bind(redisClient);
exports.rSetAsync = promisify(client.set).bind(redisClient);

exports.fetch = async (key) => {
    if (await rGetAsync(key)) {
        await set 
    }
};
