const geocodingRouter = require('express').Router({ mergeParams: true });

geocodingRouter.get('/ping', (req, res, next) => {
    res.status(200).json({ message: 'Geocoding PONG' });
});

module.exports = geocodingRouter;
