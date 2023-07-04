const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ShareScreenSession = new Schema({
  token: String,
  roomId: String,
  userId: String,
  clientName: String,
  channelName: String,
  info: String,
  uid: String,
  isActive: {type: Boolean, default: true}
}, { collection: 'share_screen_session' })

module.exports = mongoose.model('ShareScreenSession', ShareScreenSession)