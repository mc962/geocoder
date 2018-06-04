const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');

const validateLocationParams = [
    check('latLng').exists().isJSON(),
    sanitize('latLng').customSanitizer((val) => {
        return JSON.parse(val);
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.mapped() });
        }
        next();
    },
];

module.exports = {
    validateLocationParams: validateLocationParams,
};
