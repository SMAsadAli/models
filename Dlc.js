var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const AssetsInfoSchema = new Schema(
    {
        name: Number,
        version: Number,
    },
    { _id: false }
);

const ThumbnailSchema = new Schema(
    {
        link: String,
    },
    { _id: false }
);

const AdditionalDataSchema = new Schema(
    {
        link: String,
        key: String,
        value: String,
    },
    { _id: false }
);

const DlcSchema = new Schema(
    {
        dlcId: String,
        name: String,
        version: Number,
        category: Number,
        format: Number,
        thumbnails: [ThumbnailSchema],
        envCover: {type: String, default: null},
        assetsInfo: [AssetsInfoSchema],
        additionalData: [AdditionalDataSchema],
    },
    { collection: "dlc" }
);

DlcSchema.set("timestamps", true);

module.exports = mongoose.model("DLC", DlcSchema);
