const { rFetchAsync, redisOptions } = require('../util/redis');

const testRedisHealth = async () => {
    const fetchCb = () => {
        return new Date();
    };
    const cbOptions = {
        fetchCb: fetchCb,
    };

    const requestRedisParams = redisOptions([{name: 'ex', value: 60}]);

    return await rFetchAsync('redis-health', cbOptions, requestRedisParams.ex)
        .then((response) => {
            const testResponse = new Date(response);
            if (testResponse instanceof Date) {
                return 'OK';
            } else {
                return 'Redis Object Serialization/Deserialization Error';
            }
        })
        .catch((err) => {
            return err.toString();
        });
};

module.exports = {
    testRedisHealth: testRedisHealth,
};
