const geocodingRouter = require('express').Router({ mergeParams: true });
const geocodingController = require('../controllers/geocodingController');

geocodingRouter.get('/geocode', geocodingController.geocode);

geocodingRouter.get('/ping', (req, res, next) => {
    res.status(200).json({ message: 'Geocoding PONG' });
});

module.exports = geocodingRouter;
