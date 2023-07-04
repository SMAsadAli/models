// Require Mongoose
var mongoose = require('mongoose')
const multimedia = require('../helpers/multimedia')

// Define a schema
var Schema = mongoose.Schema

var DriveAssetSchema = new Schema({
    assets: [{type: mongoose.Schema.Types.ObjectId, ref: 'DriveAsset'}],
    assetType:{
        type: String,
        enum: ['FILE', 'FOLDER']
    },
    name: String,
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    assetOwner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    sharedWith: [{
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        permission: {
            type: String,
            enum: ['READ_ONLY', 'READ_WRITE', 'FULL_ACCESS']
        }
    }],
    extension: String,
    size: Number,
    sizeCategory: String,
    createdAt: { type: Date },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'drive_assets' })

DriveAssetSchema.statics.CONSTANTS = {
    PARAMS: {
        NAME: 'name',
        ASSET_TYPE: 'assetType',
        PARENT_ASSET_ID: 'parentAssetId',
        FILE: 'file'
    },
    ASSET_TYPES: {
        FILE: 'FILE',
        FOLDER: 'FOLDER'
    },
    DEFAULT_ASSET_NAMES: {
        USER_DRIVE: 'My Drive',
        SHARED_WITH_USER_DRIVE: 'Shared With Me'
    },
    ASSET_FOLDER_KEY: process.env.S3_ENV_KEY + '/' + 'Drives/Data'
}

DriveAssetSchema.statics.removeChildAssets = async (asset, DriveAsset, s3location) => {
    if (asset.assets && asset.assets.length) {
        let childAssets = await DriveAsset.find({ _id: asset.assets })
        for (let childAsset of childAssets) {
            await DriveAsset.removeChildAssets(childAsset, DriveAsset, s3location)
        }
    }
    await multimedia.deleteFile(s3location, DriveAsset.CONSTANTS.ASSET_FOLDER_KEY + '/' + asset._id + asset.extension  )
    await asset.remove()
}
module.exports = mongoose.model('DriveAsset', DriveAssetSchema)
