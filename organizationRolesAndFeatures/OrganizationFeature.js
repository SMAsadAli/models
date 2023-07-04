const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrganizationFeatureSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: { unique: true },
    },
    key: String,
    path: String,
    isAdmin: { type: Boolean, default: false },
    isDevAdmin: { type: Boolean, default: false },
    tabOrder: Number
  },
  { collection: 'organization_features' }
);

module.exports = mongoose.model('OrganizationFeature', OrganizationFeatureSchema);
