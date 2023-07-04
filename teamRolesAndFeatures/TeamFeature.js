const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeamFeatureSchema = new Schema(
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
  { collection: 'team_features' }
);

module.exports = mongoose.model('TeamFeature', TeamFeatureSchema);
