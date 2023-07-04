const mongoose = require('mongoose')
const globalConstants = require('../../config/globalConstants')

const Schema = mongoose.Schema

const TeamFeatureAndOperationsSchema = new Schema({
  feature: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamFeature' },
  operations: [{
    type: String,
    enum: [globalConstants.PERMISSIONS.CREATE, globalConstants.PERMISSIONS.READ, globalConstants.PERMISSIONS.UPDATE, globalConstants.PERMISSIONS.DELETE]
  }]
})


const TeamRoleSchema = new Schema({
  name: String,
  key: {
    type: String,
    unique: true
  },
  features: [TeamFeatureAndOperationsSchema]
}, { collection: 'team_roles' })


module.exports = mongoose.model('TeamRole', TeamRoleSchema)