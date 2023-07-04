const mongoose = require('mongoose')
const globalConstants = require('../../config/globalConstants')

const Schema = mongoose.Schema

const ArthurFeatureAndOperationsSchema = new Schema({
  feature: { type: mongoose.Schema.Types.ObjectId, ref: 'ArthurFeature' },
  operations: [{
    type: String,
    enum: [globalConstants.PERMISSIONS.CREATE, globalConstants.PERMISSIONS.READ, globalConstants.PERMISSIONS.UPDATE, globalConstants.PERMISSIONS.DELETE]
  }]
})


const ArthurRoleSchema = new Schema({
  name: String,
  key: {
    type: String,
    unique: true
  },
  features: [ArthurFeatureAndOperationsSchema]
}, { collection: 'arthur_roles' })


module.exports = mongoose.model('ArthurRole', ArthurRoleSchema)