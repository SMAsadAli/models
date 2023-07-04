// Require Mongoose
var mongoose = require('mongoose')

// Define a schema
var Schema = mongoose.Schema

var SavedRoomSchema = new Schema({
    _id: String,
    client: String,
    remote_path: String,
    saved: Number,
    created: Number,
    creator: String,
    title: String,
    description: String,
    password: String,
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'READYTOLOAD', 'DELETED']
    },
    linkId: String,
    environment: String
}, { collection: 'saved_rooms' })

SavedRoomSchema.statics.CONSTANTS = {

    STATUSES: {
        ACTIVE: 'ACTIVE',
        INACTIVE: 'INACTIVE',
        READYTOLOAD: 'READYTOLOAD',
        DELETED: 'DELETED'
    },
    PARAMS: {
        REMOTE_PATH: 'remote_path',
        CLIENT: 'client',
        SAVED: 'saved',
        CREATED: 'created',
        CREATOR: 'creator',
        TITLE: 'title',
        DESCRIPTION: 'description',
        ENVIRONMENT: 'environment',
        MEETING_ID: '_id'
    }
}


module.exports = mongoose.model('SavedRoom', SavedRoomSchema)
