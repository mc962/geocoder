const _first = require('lodash/first');

const mapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_API_KEY,
    Promise: Promise,
});


const geocode = async (req, res) => {
    await mapsClient.geocode({
        address: req.params.address || req.query.address,
    }).asPromise()
    .then((response) => {
        results = response.json.results;
        status = response.status;
        responseData = {status: status, results: results};
        return Promise.resolve(responseData);
    })
    .catch((err) => {
        return new Promise((resolve, reject) => {
            reject(err);
        });
    });
};

const coordinates = async (req, res) => {
    await geocode(req)
    .then((responseData) => {
        singleResults = _first(results);
        latLng = singleResults.geometry.location;
        address = singleResults.formatted_address;
        console.log(`Status: ${status} - City: ${address} -`,
            `Latitude: ${latLng.lat} -`,
            `Longitude: ${latLng.lng}`);

        const responseJSON = {
            location: address,
            coordinates: latLng,
        };

        res.send(200, responseJSON);
    })
    .catch((err) => {
        _handleGeocodeError(res, err);
    });
};

const reverseGeocode = async (req, res) => {
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
        _handleGeocodeError(res, err);
    });
};

const _handleGeocodeError = (res, err) => {
    const errorMessage = `${err.json.status}: ${err.json.error_message}`;
    const logMessage = `${err.status} - ${errorMessage}`;
    status = err.status >= 400 ? err.status : 500;
    console.error(logMessage);
    res.send(status, errorMessage);
};

module.exports = {
    coordinates: coordinates,
    reverseGeocode: reverseGeocode,
};
