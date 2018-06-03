const slugify = require('slugify');
const redis = require('../util/redis');

const mapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_API_KEY,
    Promise: Promise,
});

exports.geocodeFromCache = (req, res) => {
    const key = `geocode_cache:${_citySlug(req.address)}`;

    // return redis.fetchAsync(key, geocode, [req, res]);
};

exports.reverseGeocodeFromCache = (req, res) => {
    const key = `reverse_geocode_cache:${_coordsSlug(req.latLng)}`;
};

exports.geocode = (req, res) => {
    const address = req.params.address || req.query.address;
    _geocode(address)
    .then((response) => {
        res.send(response.status, response.message);
    })
    .catch((err) => {
        res.send(response.status, response.payload);        
    });
};


const _geocode = async (address) => {
    await mapsClient.geocode({
        address: address,
    }).asPromise()
        .then((response) => {
            const results = response.json.results[0];
            const latLng = results.geometry.location;
            const address = results.formatted_address;
            // console.log(`City: ${address} -`,
            //     `Latitude: ${latLng.lat} -`,
            //     `Longitude: ${latLng.lng}`);

            const responseJSON = {
                location: address,
                coordinates: latLng,
            };

            // res.send(200, responseJSON);
            const payload = {
                status: 200,
                responseJSON: responseJSON,
                error: false,
            };

            return payload;
        })
        .catch((err) => {
            const errorMessage = `${err.json.status}: ${err.json.error_message}`;
            const status = err.status >= 400 ? err.status : 500;
            // console.error(errorMessage);
            // res.send(status, errorMessage);

            const payload = {
                status: status,
                message: errorMessage,
                error: true,
            };

            return payload;
        });
};

exports.reverseGeocode = async (req, res) => {
    // TODO logic to handle geolocation information stored on request cookies
    const latLngStr = req.params.latLng || req.query.latLng;
    let latLng;
    try {
        latLng = JSON.parse(latLngStr);
    } catch (err) {
        console.error(err);
        latLng = null;
    }
    await mapsClient.reverseGeocode({
        latlng: latLng,
    }).asPromise()
        .then((response) => {
            const address = response.json.results[0].formatted_address;
            console.log(`City: ${address}`);

            responseJSON = {
                location: address,
            };

            res.send(200, responseJSON);
        })
        .catch((err) => {
            const errorMessage = `${err.json.status}: ${err.json.error_message}`;
            status = err.status >= 400 ? err.status : 500;
            console.error(errorMessage);
            res.send(500, errorMessage);
        });
};
const _reverseGeocode = () => {

};

const _citySlug = (str) => {
    return slugify(str.toLowerCase());
};

const _coordsSlug = (coords) => {
    return `lat-${coords.lat}-lon-${coords.lon}`;
};