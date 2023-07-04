const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserFeatureSchema = new Schema({
  feature: { type: mongoose.Schema.Types.ObjectId, ref: 'UserFeature' },
  key: { type: String },
  values: Schema.Types.Mixed
})


const MeetingRoleSchema = new Schema({
  name: String,
  key: {
    type: String,
    unique: true
  },
  features: [UserFeatureSchema]
}, { collection: 'user_roles' })


module.exports = mongoose.model('UserRole', MeetingRoleSchema)