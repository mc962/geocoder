const { promisify } = require('util');
const redisClient = require('redis').createClient(process.env.REDIS_URL);

// Results may come back (from Google) as arrays. For simplicity, these will
// simply be stringified and store in Redis. While this is not necessarily the
// most efficient method of doing so, it is still extremely quick for the small
// number of results being stored
// (likely never more than 10 objects, with maybe 5 keys each to stringify)

const rGetAsync = promisify(redisClient.get).bind(redisClient);
const rSetAsync = promisify(redisClient.set).bind(redisClient);


const rFetchAsync = async (key, fetchCb = null, cbArgs = []) => {
    // TODO handle TTLs
    if (fetchCb) {
        return await rGetAsync(key).then((responseVal) => {
            if (responseVal) {
                const deserializedResults = _deserializeListResults(responseVal); // eslint-disable-line max-len
                return deserializedResults;
            } else {
                return fetchCb(...cbArgs)
                    .then(async (resp) => {
                        const serializedResults = _serializeListResults(results); // eslint-disable-line max-len
                        await rSetAsync(key, serializedResults)
                            .then((setRes) => {
                                return results;
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

const _serializeListResults = (results) => {
    let serializedResults;
    try {
        serializedResults = JSON.stringify(results);
    } catch (e) {
        // catch potential JSON serialziation errors, and return a blank array
        // indicating no good results found (and preventing disruptions
        // to future data flow), along with logging the message
        console.error(e);
        return [];
    }
    return serializedResults;
};

const _deserializeListResults = (results) => {
    let deserializedResults;
    try {
        deserializedResults = JSON.parse(result);
    } catch (e) {
        // catch potential JSON deserialziation errors, and return a blank array
        // indicating no good results retrieved from redis
        // (and preventing disruptionsto future data flow),
        // along with logging the message
        console.error(e);
        return [];
    }
    return deserializedResults;
};

module.exports = {
    rGetAsync: rGetAsync,
    rSetAsync: rSetAsync,
    rFetchAsync, rFetchAsync,
};
