var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const DlcVersionSchema = new Schema(
    {
        link: String,
        version: Number,
    },
    { _id: false }
);

const PlatformSchema = new Schema(
    {
        name: Number,
        versions: [DlcVersionSchema],
    },
    { _id: false }
);

const DlcVersioncSchema = new Schema(
    {
        dlcId: String,
        platforms: [PlatformSchema],
    },
    { collection: "dlc_assets_versions" }
);

DlcVersioncSchema.set("timestamps", true);

module.exports = mongoose.model("DLCAssetVersion", DlcVersioncSchema);
