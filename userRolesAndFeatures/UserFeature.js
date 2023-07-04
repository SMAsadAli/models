const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserFeatureSchema = new Schema(
  {
    name: String,
    key: String,
    type: String,
  },
  { collection: 'user_features' }
);

UserFeatureSchema.statics.CONSTANTS = {
  PARAMS: {
    FEATURE_NAME: 'name',
    FEATURE_TYPE: 'type',
    FEATURE_KEY: 'key',
  },
};
module.exports = mongoose.model('UserFeature', UserFeatureSchema);
