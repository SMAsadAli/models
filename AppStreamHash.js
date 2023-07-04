// Require Mongoose
var mongoose = require('mongoose')

// Define a schema
var Schema = mongoose.Schema

var AppStreamHashSchema = new Schema({
    hash: String,
}, { collection: 'appstream_hash' })

AppStreamHashSchema.statics.CONSTANTS = {
    PARAMS: {
        HASH: "hash",
        PARAMS_URI: "paramsURI"
    }
};

module.exports = mongoose.model('AppStreamHash', AppStreamHashSchema)
