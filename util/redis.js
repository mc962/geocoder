const { promisify } = require('util');
const redisClient = require('redis').createClient(process.env.REDIS_URL);
const moment = require('moment');

// Results may come back (from Google) as arrays. For simplicity, these will
// simply be stringified and store in Redis. While this is not necessarily the
// most efficient method of doing so, it is still extremely quick for the small
// number of results being stored
// (likely never more than 10 objects, with maybe 5 keys each to stringify)

const rGetAsync = promisify(redisClient.get).bind(redisClient);
const rSetAsync = promisify(redisClient.set).bind(redisClient);


const rFetchAsync = async (key, fetchCb = null, cbArgs = [], redisOptions = []) => { // eslint-disable-line max-len
    // TODO handle TTLs/redis request options
    // add support to other functions as needed
    if (fetchCb) {
        return await rGetAsync(key).then((responseVal) => {
            if (responseVal) {
                const deserializedResults = _deserializeListResults(responseVal); // eslint-disable-line max-len
                return deserializedResults;
            } else {
                return fetchCb(...cbArgs)
                    .then(async (resp) => {
                        const serializedResults = _serializeGeocoderResult(resp); // eslint-disable-line max-len
                        return await rSetAsync(key, serializedResults, ...redisOptions) // eslint-disable-line max-len
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
                let finalResponse;
                if (response) {
                    finalResponse = _deserializeListResults(response); // eslint-disable-line max-len
                } else {
                    finalResponse = [];
                }
                return finalResponse;
            })
            .catch((err) => {
                return {status: 200, results: finalResponse};
            });
    }
};

const _serializeGeocoderResult = (result) => {
    let serializedResult;
    try {
        serializedResult = JSON.stringify(result);
    } catch (e) {
        // catch potential JSON serialziation errors, and return a blank array
        // indicating no good results found (and preventing disruptions
        // to future data flow), along with logging the message
        console.error(e);
        return '[]';
    }
    return serializedResult;
};

const _deserializeListResults = (results) => {
    let deserializedResults;
    try {
        deserializedResults = JSON.parse(results);
    } catch (e) {
        // catch potential JSON deserialziation errors, and return a blank array
        // indicating no good results retrieved from redis
        // (and preventing disruptionsto future data flow),
        // along with logging the message
        console.error(e);
        return '[]';
    }
    return deserializedResults;
};

const redisOptions = (...requestParams) => {
    // Default options for a particular redis request
    // EX: 30 days
    const defaultOptions = Object.freeze({
        ex: ['EX', moment.duration(30, 'days').asSeconds()],
    });

    const requestOptions = Object.assign({}, defaultOptions);
    requestParams.forEach((param) => {
        requestOptions[param.name] = param.value;
    });

    return requestOptions;
};

module.exports = {
    rGetAsync: rGetAsync,
    rSetAsync: rSetAsync,
    rFetchAsync: rFetchAsync,
    redisOptions: redisOptions,
};
