// Require Mongoose
var mongoose = require('mongoose')

// Define a schema
var Schema = mongoose.Schema

var ReleaseSchema = new Schema({
    _id: String,
    s3Path: String,
    createdAt: { type: Date, default: Date.now },
    client: String,
    region: String,
    version: String,
    questS3Path: String,
    type: String,
    isForced: Boolean,
    voipMode: String,
    isLatest: {
      type: Boolean,
      default: false,
    },
    standAlonePath: String,
}, { collection: 'releases' })

module.exports = mongoose.model('Release', ReleaseSchema)
