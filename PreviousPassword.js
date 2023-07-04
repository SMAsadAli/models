// Require Mongoose
var mongoose = require('mongoose')

// Define a schema
var Schema = mongoose.Schema

var PreviousPasswordSchema = new Schema({
    password: String,
    salt: String,
    timeStamp: { type: Date, default: Date.now },
    algorithem: String,
}, { collection: 'previous_password' })


module.exports = mongoose.model('PreviousPassword', PreviousPasswordSchema)
