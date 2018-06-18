const { rPing } = require('../util/redis');

const testRedisHealth = async () => {
    return await rPing()
        .then((response) => {
            if (response === 'PONG') {
                return 'OK';
            } else {
                return 'REDIS CONNECTION ERROR';
            }
        })
        .catch((err) => {
            return err.toString();
        });
};

module.exports = {
    testRedisHealth: testRedisHealth,
};
