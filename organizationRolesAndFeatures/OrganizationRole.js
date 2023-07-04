const mongoose = require('mongoose')
const globalConstants = require('../../config/globalConstants')

const Schema = mongoose.Schema

const OrganizationFeatureAndOperationsSchema = new Schema({
  feature: { type: mongoose.Schema.Types.ObjectId, ref: 'OrganizationFeature' },
  operations: [{
    type: String,
    enum: [globalConstants.PERMISSIONS.CREATE, globalConstants.PERMISSIONS.READ, globalConstants.PERMISSIONS.UPDATE, globalConstants.PERMISSIONS.DELETE]
  }]
})

const OrganizationRoleSchema = new Schema({
  name: String,
  key: {
    type: String,
    unique: true
  },
  features: [OrganizationFeatureAndOperationsSchema]
}, { collection: 'organization_roles' })


module.exports = mongoose.model('OrganizationRole', OrganizationRoleSchema)