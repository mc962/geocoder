const geocodingRouter = require('express').Router({ mergeParams: true });
const geocodingController = require('../controllers/geocodingController');
const validateCoordinatesParams = require('../middlewares/validators/validate_geocode').validateCoordinatesParams; // eslint-disable-line max-len
const validateLocationParams = require('../middlewares/validators/validate_reverse_geocode').validateLocationParams; // eslint-disable-line max-len

geocodingRouter.get('/coordinates', [
    ...validateCoordinatesParams,
    geocodingController.coordinates,
]);

geocodingRouter.get('/location', [
    ...validateLocationParams,
    geocodingController.place,
]);

geocodingRouter.get('/redis', geocodingController.testRedis);

geocodingRouter.get('/ping', (req, res, next) => {
    res.status(200).json({ message: 'Geocoding PONG' });
});

module.exports = geocodingRouter;
