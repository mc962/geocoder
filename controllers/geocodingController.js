const mapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_API_KEY,
    // key: 'AIzaSyDKm2OaKWbipDCIQCpIAIsLzdiAXGcDH88',
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
        console.error(errorMessage);
        res.send(500, errorMessage);
    });
};
