const _first = require('lodash/first');
const slugify = require('slugify');
const redis = require('../util/redis');

const mapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_API_KEY,
    Promise: Promise,
});

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
        return Promise.resolve(responseData);
    })
    .catch((err) => {
        Promise.reject(err);
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
        return Promise.resolve(responseData);
    })
    .catch((err) => {
        Promise.reject(err);
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
};
///////////////////////////////////////////////
const _citySlug = (str) => {
    return slugify(str.toLowerCase());
};

const _coordsSlug = (coords) => {
    return `lat-${coords.lat}-lon-${coords.lon}`;
};


exports.geocodeFromCache = (req, res) => {
    const key = `geocode_cache:${_citySlug(req.address)}`;

    // return redis.fetchAsync(key, geocode, [req, res]);
};

exports.reverseGeocodeFromCache = (req, res) => {
    const key = `reverse_geocode_cache:${_coordsSlug(req.latLng)}`;
};
