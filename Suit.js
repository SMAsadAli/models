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

const TextureSchema = new Schema(
  {
    textureId: String,
    name: String,
    color: String,
    textureLink: String,
  },
  { _id: false }
);

const SuitSchema = new Schema(
  {
    suitId: String,
    rigId: String,
    suitName: String,
    suitVersion: Number,
    meshOnlyRefLink: String,
    meshPlusRigRefLink: String,
    active: Boolean,
    textures: [TextureSchema],
    headData: {
      headPosition: DimensionsSchema,
      scaleOffset: DimensionsSchema,
    },
  },
  { collection: 'suit' }
);

SuitSchema.set('timestamps', true);

module.exports = mongoose.model('Suit', SuitSchema);
