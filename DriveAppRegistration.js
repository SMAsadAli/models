// Require Mongoose
var mongoose = require('mongoose')

// Define a schema
var Schema = mongoose.Schema

var DriveAppRegistrationSchema = new Schema({
    clientId: String,
    clientSecret: String,
    redirectUrl: String,
    appName: String,
    userId: {type: mongoose.Schema.Types.ObjectId, ref:'User'},
    createdAt: { type: Date },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'drive_app_registrations' })

DriveAppRegistrationSchema.statics.CONSTANTS = {
    CODE_TYPES: {
        'AUTHORIZATION':'authorization_code',
        'REFRESH_TOKEN':'refresh_token'
    }
}
module.exports = mongoose.model('DriveAppRegistrations', DriveAppRegistrationSchema)
