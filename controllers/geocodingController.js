const _first = require('lodash/first');
const slugify = require('slugify');
const { rFetchAsync, redisOptions } = require('../util/redis');

const mapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_API_KEY,
    Promise: Promise,
});

const _coordinatesFromCache = async (address) => {
    const key = _citySlug(address);
    return await rFetchAsync(key, _geocode, [address], redisOptions().ex)
        .then((responseData) => {
            return responseData;
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
    const address = req.params.address || req.query.address;

    const geocode = cached ? _coordinatesFromCache : _geocode;

    await geocode(address)
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
    await mapsClient.geocode({
        address: address,
    }).asPromise()
    .then((response) => {
        status = response.status;
        results = response.json.results;
        responseData = { status: status, results: results };
        Promise.resolve(responseData);
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
