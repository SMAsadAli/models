const mongoose = require('mongoose')

const Schema = mongoose.Schema

const OAuthTwoSchema = new Schema({
  accessToken: String,
  accessTokenExpiry: Number,
  accessTokenIssuedTime: Number,
}, { collection: 'oauth_two' })
OAuthTwoSchema.set('timestamps', true);
OAuthTwoSchema.index({ "createdAt": 1 }, { expireAfterSeconds:  86400})
module.exports = mongoose.model('OAuthTwo', OAuthTwoSchema)
