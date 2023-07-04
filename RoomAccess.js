const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomAccessSchema = new Schema(
  {
    roomUrl: String,
    shortenUrl: String,
    urlState: String,
    roomId: String,
    allowAccess: { type: Boolean, default: false },
    passwordProtect: { type: Boolean, default: false },
  },
  { collection: 'room_access' }
);

RoomAccessSchema.set("timestamps", true);

module.exports = mongoose.model('RoomAccess', RoomAccessSchema);
