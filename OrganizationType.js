const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OrganizationTypeSchema = new Schema({
  name: String,
  type: String,
  key: {
    type: String,
    unique: true
  },
}, { collection: 'organization_types' })


module.exports = mongoose.model('OrganizationType', OrganizationTypeSchema)