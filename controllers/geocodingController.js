const _first = require('lodash/first');
const slugify = require('slugify');
const { rFetchAsync, redisOptions } = require('../util/redis');
const { GeocoderServiceResult } = require('../util/geocoding');

const mapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_API_KEY,
    Promise: Promise,
});

const _coordinatesFromCache = async (address, deleteCached = false) => {
    const key = _citySlug(address);
    return await rFetchAsync(key, null, [address], redisOptions().ex)
        .then((responseData) => {
            const resultObj = GeocoderServiceResult.coerceResult(responseData);
            return resultObj;
        })
        .catch((err)=> {
            return err;
        });
};

const _placeFromCache = async (latLng) => {
    const key = _coordsSlug(latLng);
    rFetchAsync(key, _reverseGeocode, [latLng])
        .then((responseData) => {
            return responseData;
        })
        .catch((err) => {
            return err;
        });
};

const coordinates = async (req, res) => {
    const cached = req.params.cached || req.query.cached;
    const deleteCached = req.params.delete_cached || req.query.delete_cached;
    const address = req.params.address || req.query.address;

    const geocode = cached ? _coordinatesFromCache : _geocode;

    await geocode(address, deleteCached)
        .then((geocodeResult) => {
            if (geocodeResult.empty()) {
                const err = _constructLocalGeocodeError(404, 'NOT FOUND', 'No results found'); // eslint-disable-line max-len
                _handleGeocodeError(res, err);
            } else {
                const latLng = geocodeResult.latLng();
                const address = geocodeResult.address();
                const status = geocodeResult.status;
                console.log(`Status: ${status} - City: ${address} -`,
                    `Latitude: ${latLng.lat} -`,
                    `Longitude: ${latLng.lng}`);

                const responseJSON = {
                    location: address,
                    coordinates: latLng,
                };
                res.status(geocodeResult.status).json(responseJSON);
            }
        })
        .catch((err) => {
            _handleGeocodeError(res, err);
        });
};

const place = async (req, res) => {
    const cached = req.params.cached || req.query.cached;
    const latLng = req.params.latLng || req.query.latLng;

    const reverseGeocode = cached ? _placeFromCache : _reverseGeocode;

    await reverseGeocode(latLng)
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

const _geocode = async (address) => {
    return await mapsClient.geocode({
        address: address,
    }).asPromise()
    .then((response) => {
        const status = response.status;
        const results = response.json.results;
        const geocodeResult = new GeocoderServiceResult(status, results);
        return geocodeResult;
    })
    .catch((err) => {
        return err;
    });
};

const _reverseGeocode = async (latLng) => {
    // TODO logic to handle geolocation information stored on request cookies
    await mapsClient.reverseGeocode({
        latlng: latLng,
    }).asPromise()
    .then((response) => {
        const status = response.status;
        const results = response.json.results;
        const responseData = { status: status, results: results };
        return responseData;
    })
    .catch((err) => {
        return err;
    });
};

const _handleGeocodeError = (res, err) => {
    const errorMessage = `${err.json.status}: ${err.json.error_message}`;
    const logMessage = `${err.status} - ${errorMessage}`;
    const status = err.status >= 400 ? err.status : 500;
    console.error(logMessage);
    res.status(status).json({message: errorMessage});
};

const _constructLocalGeocodeError = (status, errorStatus, message) => {
    return {
        status: status,
        json: {
            status: errorStatus,
            error_message: message,
        },
    };
};

const _citySlug = (str) => {
    return slugify(str.toLowerCase());
};

const _coordsSlug = (coords) => {
    return `lat-${coords.lat}-lon-${coords.lon}`;
};

module.exports = {
    coordinates: coordinates,
    place: place,
};
