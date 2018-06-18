/**
 * custom Error for features that are not yet implemented
 */
class NotImplementedError extends Error {
    /**
     * intialize NotImplementedError
     * @param {*} params remaining internal params for Error
     * to be passed to parent constructor
     */
    constructor(...params) {
        // Pass remaining arguments (including vendor specific ones)
        // to parent constructor
        super(...params);
        // Maintains proper stack trace for where the error was thrown
        // (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError);
        }
    }
}

module.exports = {
    NotImplementedError: NotImplementedError,
};
