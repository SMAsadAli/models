const mongoose = require("mongoose");
const globalConstants = require("../config/globalConstants");

const Schema = mongoose.Schema;

const UserDeviceSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userDeviceId: String,
    oAuthTwo: { type: mongoose.Schema.Types.ObjectId, ref: "OAuthTwo" },
    userDeviceType: {
      type: String,
      enum: Object.values(globalConstants.USERDEVICE_TYPE),
    },
  },
  { collection: "user_device", timestamps: true }
);
UserDeviceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
module.exports = mongoose.model("UserDevice", UserDeviceSchema);
