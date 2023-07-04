// Require Mongoose
var mongoose = require("mongoose");
const globalConstants = require("../config/globalConstants");
// Define a schema
var Schema = mongoose.Schema;

var TeamMemberSchema = new Schema(
  {
    inviteCode: String,
    email: String,
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    temporaryPassword: String,
    status: {
      type: String,
      enum: globalConstants.TEAM_MEMBERS.statusesEnum,
    },
  },
  { collection: "team_members" }
);

module.exports = mongoose.model("TeamMember", TeamMemberSchema);
