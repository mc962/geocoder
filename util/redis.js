const { promisify } = require('util');
const redisClient = require('redis').createClient(process.env.REDIS_URL);

exports.rGetAsync = promisify(redisClient.get).bind(redisClient);
exports.rSetAsync = promisify(redisClient.set).bind(redisClient);

exports.fetchAsync = async (key, opts, cbArgs) => {
    // if get(key) is true
        // return get(key)
    // else get val from service
    // then set(key, val)

    await rGetAsync(key).then((response) => {
        if (response) {
            promCb(...cbArgs)
            .then(async (resp) => {
                await rSetAsync(key, resp, opts).then(() => resp);
            })
            .catch((err) => {
                console.error(err);
                return null;
            });
        }
    });
};
