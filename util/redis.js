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
const rDelAsync = promisify(redisClient.del).bind(redisClient);
const rPing = promisify(redisClient.ping).bind(redisClient);

/**
 * Gets a value under a specified key in Redis, if no value is returned,
 * (cache miss), may supply a callback to return new data
 * if callback is supplied, returned value of callback is serialized
 * and written to cache, and then returned from the fetch function
 * @param {String} key string
 * @param {Object} cbOptions arguments to be passed to the supplied callback
 * @param {Array} redisOptions arguments to be passed to the redis request
 * @return {Object} payload for either returned results, NotFound
 * results, or a caught error
 */
const rFetchAsync = async (key, cbOptions, redisOptions = []) => { // eslint-disable-line max-len
    // refresh data in cache at key, if refresh_cached param provided
    return _delProm(key, cbOptions).then(async (delRes) => {
        // get data at key
        return await rGetAsync(key).then((responseVal) => {
            if (responseVal) {
                // when data retrieved from redis

                // return deserialzied response received from redis
                const deserializedResults = _deserializeListResults(responseVal); // eslint-disable-line max-len
                return deserializedResults;
            } else {
                // when no data retrieved from redis

                // obtain data using fetchCb, if fetchCb supplied
                return _fetchProm(cbOptions)
                    .then(async (resp) => {
                        if (resp === 'OK') {
                            // eslint-disable-next-line max-len
                            // when response is 'OK', means that no fetchCb was given

                            // in this case, no data was also retrieved,
                            // therefore Not Found response is assumed
                            // eslint-disable-next-line max-len
                            // TODO uncouple this form geocoding by making more genric response for geocoder to handle
                            const notFoundPayload = {
                                status: 404,
                                results: [],
                            };

                            return notFoundPayload;
                        } else {
                        /*
                        no data was retrieved from redis, but fetchCb was given

                        response was not 'OK', therefore assumed that fetchCb
                        was given
                        results are therefore serialized and added to redis
                        */
                            const serializedResults = _serializeGeocoderResult(resp); // eslint-disable-line max-len
                            return await rSetAsync(key, serializedResults, ...redisOptions) // eslint-disable-line max-len
                            .then((setRes) => {
                                return resp;
                            })
                            .catch((err) => {
                                return err;
                            });
                        }
                    })
                    .catch((err) => {
                        return err;
                    });
            }
        });
    });
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

const _delProm = (key, cbOptions) => {
    let deletePromise;
    if (cbOptions.refreshCached) {
        deletePromise = async () => {
            return await rDelAsync(key);
        };
    } else {
        deletePromise = async () => {
            return new Promise((resolve, _) => {
                resolve('OK');
            });
        };
    }

    return deletePromise();
};

const _fetchProm = (cbOptions) => {
    let fetchPromise;
    if (cbOptions.fetchCb) {
        fetchPromise = async () => {
            return cbOptions.fetchCb(...cbOptions.cbArgs);
        };
    } else {
        fetchPromise = async () => {
            return new Promise((resolve, _) => {
                resolve('OK');
            });
        };
    }

    return fetchPromise();
};

module.exports = {
    rGetAsync: rGetAsync,
    rSetAsync: rSetAsync,
    rFetchAsync: rFetchAsync,
    rPing: rPing,
    redisOptions: redisOptions,
};
