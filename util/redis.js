const { promisify } = require('util');
const redisClient = require('redis').createClient(process.env.REDIS_URL);

const rGetAsync = promisify(redisClient.get).bind(redisClient);
const rSetAsync = promisify(redisClient.set).bind(redisClient);

const rFetchAsync = async (req, res, key, fetchCb = null, cbArgs = []) => {
    // if get(key) is true
        // return get(key)
    // else get val from service
    // then set(key, val)
    // TODO handle TTLs
    if (fetchCb) {
        return await rGetAsync(key).then((responseVal) => {
            // console.log(responseVal);
            if (responseVal) {
                return responseVal;
            } else {
                return fetchCb(req, res, ...cbArgs)
                    .then(async (resp) => {
                        await rSetAsync(key, resp)
                            .then((setRes) => {
                                return resp;
                            });
                    })
                    .catch((err) => {
                        return err;
                    });
            }
        });
    } else {
        return await rGetAsync(key)
            .then((response) => {
                return responseVal;
            })
            .catch((err) => {
                return err;
            });
    }
};

module.exports = {
    rGetAsync: rGetAsync,
    rSetAsync: rSetAsync,
    rFetchAsync, rFetchAsync,
};
