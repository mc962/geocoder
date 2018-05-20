// import base express modules
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const winston = require('winston');
const { format } = require('logform');
const bodyParser = require('body-parser');
// const fs = require('fs');

// import manually defined config
const config = require('./config');

// import controller routers
const geocoding = require('./routes/geocoding');
const places = require('./routes/places');
const directions = require('./routes/directions');

// init express app
const app = express();

// init logger
const logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: `${config.rootPath}/logs/${process.env.NODE_ENV}.log`,
            handleExceptions: true,
            json: true,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            colorize: false,
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: 'true',
            json: false,
            colorize: true,
        }),
    ],
    format: format.combine(
        format.simple()
    ),
    exitOnError: false,
});

logger.stream = {
    write: (message, encoding) => {
        logger.info(message);
    },
};

// init packages
app.use(morgan('combined', { stream: logger.stream }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser(process.env.SECRET_KEY_BASE));
app.use(express.static(path.join(__dirname, 'public')));

// init main router
const router = express.Router();
// add controller routers to top-level router
router.use('/geocoding', geocoding);
router.use('/places', places);
router.use('/directions', directions);

// add top-level router routes
router.get('/ping', (req, res) => {
    res.status(200).json({message: 'PONG'});
});


// add router to app, with everything namespaced under config prefix
app.use(config.apiPrefix, router);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500)
    .json({status: res.locals.status, message: res.locals.message});
});

module.exports = app;
