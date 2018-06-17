const _first = require('lodash/first');
const {NotImplementedError} = require('../util/errors');

/**
 * Format a geocoder response into an expected results object
 */
class GeocoderServiceResult {
    /**
     * Constructs a GeocoderServiceResult using a status and
     * results obtained directly from service
     * @param {Number} status HTTP status obtained directly from service
     * @param {Array} results Collection of results objects from service
     */
    constructor(status = 200, results = []) {
        this.status = status;
        this.results = results;
        // first result is most accurate result, usually used
        // in other methods for obtaining properties from
        this.firstResult = _first(results);
    }

    /**
     * @return {Object} location object representing latLng coordinates
     */
    latLng() {
        return this.firstResult.geometry.location;
    }

    /**
     * @return {String} address string extracted form results
     */
    address() {
        return this.firstResult.formatted_address;
    }

    /**
     * check if any results retrieved
     * @return {Boolean}
     */
    empty() {
        return this.results.length === 0;
    };

    /**
     * coerces a given data object (assumed to be an array at this point)
     * into new Result object for further use
     * @param {Array} data object to be coerced into new Result object
     * @return {GeocoderServiceResult} return either existing
     * GeocoderServiceResult object or  new object constructed from data
     */
    static coerceResult(data) {
        if (data instanceof GeocoderServiceResult) {
            return data;
        } else {
            return new GeocoderServiceResult(data.status, data.results);
        }
    }

    // /**
    //  * serialize Result to a desired format
    //  * @param {String} method used to serialize Result to acceptable format
    //  * (default and only supported is JSON right now)
    //  * @return {String} serialized result in desired format
    //  */
    // serialize(method = 'json') {
    //     if (method === 'json') {
    //         return JSON.stringify(this);
    //     } else {
    //         throw new NotImplementedError('Only JSON serialization is currently supported'); // eslint-disable-line max-len
    //     }
    // }

    // /**
    //  * deserialize Result from a desired format
    //  * to a new GeocoderServiceResult object
    //  * @param {*} serializedItem in a serialized format to be convertd into
    //  * a new GeocoderServiceResult object
    //  * @param {String} method used to serialize Result to acceptable format
    //  * (default and only supported is JSON right now)
    //  * @return {GeocoderServiceResult} deserialized result in a new
    //  * GeocoderServiceResult object
    //  */
    // static deserialzie(serializedItem, method = 'json') {
    //     if (method === 'json') {
    //         parsedItem = JSON.parse(serializedItem);
    //         const resultItem = new GeocoderServiceResult(200, parsedItem);
    //         return resultItem;
    //     } else {
    //         throw new NotImplementedError('Only JSON serialization is currently supported'); // eslint-disable-line max-len
    //     }
    // }
}

module.exports = {
    GeocoderServiceResult: GeocoderServiceResult,
};
