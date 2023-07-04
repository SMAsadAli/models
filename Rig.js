var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const DimensionsSchema = new Schema(
  {
    x: Number,
    y: Number,
    z: Number,
  },
  { _id: false }
);

const IKSchema = new Schema(
  {
    position: DimensionsSchema,
    rotation: DimensionsSchema,
    scale: DimensionsSchema,
  },
  { _id: false }
);

const RigSchema = new Schema(
  {
    rigId: String,
    rigName: String,
    rigLink: String,
    active: Boolean,
    rigVersion: Number,
    avatarIkData: {
      headIkOffset: IKSchema,
      leftHandIkOffset: IKSchema,
      rightHandIkOffset: IKSchema,
    },
  },
  { collection: 'rig' }
);

RigSchema.set('timestamps', true);

module.exports = mongoose.model('Rig', RigSchema);
