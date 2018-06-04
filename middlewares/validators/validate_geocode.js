const { check, validationResult } = require('express-validator/check');

const validateCoordinatesParams = [
    check('address').exists().isString(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.mapped() });
        }
        next();
    },
];

module.exports = {
    validateCoordinatesParams: validateCoordinatesParams,
};
