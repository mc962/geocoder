const mapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_API_KEY,
    Promise: Promise,
});

exports.geocode = async (req, res) => {
    await mapsClient.geocode({
        address: req.params.address || req.query.address,
    }).asPromise()
    .then((response) => {
        results = response.json.results[0];
        latLng = results.geometry.location;
        address = results.formatted_address;
        console.log(`City: ${address} -`,
        `Latitude: ${latLng.lat} -`,
        `Longitude: ${latLng.lng}`);

        const responseJSON = {
            location: address,
            coordinates: latLng,
        };

        res.send(200, responseJSON);
    })
    .catch((err) => {
        const errorMessage = `${err.json.status}: ${err.json.error_message}`;
        status = err.status >= 400 ? err.status : 500;
        console.error(errorMessage);
        res.send(status, errorMessage);
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
