const _first = require('lodash/first');
// const slugify = require('slugify');
const { rGetAsync, rSetAsync, rFetchAsync } = require('../util/redis');

const mapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_API_KEY,
    Promise: Promise,
});

const testRedis = async (req, res) => {
    const method = req.params.method || req.query.method;

    if (method === 'get') {
        await rGetAsync('get_testers')
        .then((response) => {
            console.log(response);
            res.status(200).send(response);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(err);
        });
    } else if (method === 'set') {
        await rSetAsync('set_tester', 24)
        .then((response) => {
            console.log(response);
            res.status(200).send(response);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(err);
        });
    } else if (method === 'fetch') {
        await rFetchAsync(req, res, 'fetch_tester', fetchCb)
        .then((response) => {
            console.log(response);
            res.status(200).send(response);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(err);
        });
    }
};

const fetchCb = (req, res) => {
    return new Promise((resolve, reject) => {
        const connVal = req.params.val || req.query.val;
        // 2298
        try {
            const newVal = 1 + 3 - 5 / 2 * 6 + parseInt(connVal);
            resolve(newVal);
        } catch (e) {
            reject(null);
        }
    });
};

const coordinates = async (req, res) => {
    await _geocode(req)
        .then((responseData) => {
            const singleResult = _first(results);
            const latLng = singleResult.geometry.location;
            const address = singleResult.formatted_address;
            console.log(`Status: ${status} - City: ${address} -`,
                `Latitude: ${latLng.lat} -`,
                `Longitude: ${latLng.lng}`);

            const responseJSON = {
                location: address,
                coordinates: latLng,
            };

            res.status(200).json(responseJSON);
        })
        .catch((err) => {
            _handleGeocodeError(res, err);
        });
};

const place = async (req, res) => {
    await _reverseGeocode(req)
        .then((responseData) => {
            const singleResult = _first(results);
            const address = singleResult.formatted_address;
            console.log(`City: ${address}`);

            const responseJSON = {
                location: address,
            };

            res.status(200).json(responseJSON);
        })
        .catch((err) => {
            _handleGeocodeError(res, err);
        });
};

const _geocode = async (req) => {
    await mapsClient.geocode({
        address: req.params.address || req.query.address,
    }).asPromise()
    .then((response) => {
        status = response.status;
        results = response.json.results;
        responseData = { status: status, results: results };
        return responseData;
    })
    .catch((err) => {
        return err;
    });
};

const _reverseGeocode = async (req, res) => {
    // TODO logic to handle geolocation information stored on request cookies
    const latLng = req.params.latLng || req.query.latLng;
    await mapsClient.reverseGeocode({
        latlng: latLng,
    }).asPromise()
    .then((response) => {
        status = response.status;
        results = response.json.results;
        responseData = { status: status, results: results };
        return responseData;
    })
    .catch((err) => {
        return err;
    });
};

const _handleGeocodeError = (res, err) => {
    const errorMessage = `${err.json.status}: ${err.json.error_message}`;
    const logMessage = `${err.status} - ${errorMessage}`;
    status = err.status >= 400 ? err.status : 500;
    console.error(logMessage);
    res.status(status).json({message: errorMessage});
};

module.exports = {
    coordinates: coordinates,
    place: place,
    testRedis: testRedis,
};
// ///////////////////////////////////////////////
// const _citySlug = (str) => {
//     return slugify(str.toLowerCase());
// };

// const _coordsSlug = (coords) => {
//     return `lat-${coords.lat}-lon-${coords.lon}`;
// };


// exports.geocodeFromCache = (req, res) => {
//     const key = `geocode_cache:${_citySlug(req.address)}`;

//     // return redis.fetchAsync(key, geocode, [req, res]);
// };

// exports.reverseGeocodeFromCache = (req, res) => {
//     const key = `reverse_geocode_cache:${_coordsSlug(req.latLng)}`;
// };
