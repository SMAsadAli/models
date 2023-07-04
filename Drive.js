// Require Mongoose
var mongoose = require('mongoose')
const globalConstants = require('../config/globalConstants')
const multimedia = require('../helpers/multimedia')
const DriveAsset = require('./DriveAsset')

// Define a schema
var Schema = mongoose.Schema

var DriveSchema = new Schema({
    rootAsset: { type: mongoose.Schema.Types.ObjectId, ref: 'DriveAsset' },
    driveOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { collection: 'drives' })
DriveSchema.statics.initializeUserDrives = async (user, Drive, DriveAsset) => {

    console.log('Initializing user drives')
    let userDriveAsset = new DriveAsset({
        assets: [],
        assetType: DriveAsset.CONSTANTS.ASSET_TYPES.FOLDER,
        name: DriveAsset.CONSTANTS.DEFAULT_ASSET_NAMES.USER_DRIVE,
        createdBy: user._id,
        assetOwner: user._id,
        sharedWith: [],
        extension: null,
        createdAt: Date.now()
    })
    userDriveAsset = await userDriveAsset.save()

    let userDrive = new Drive({
        rootAsset: userDriveAsset._id,
        driveOwner: user._id
    })

    userDrive = await userDrive.save()

    // TODO: Commenting for time
    // const fileSize = await multimedia.getFileSize(globalConstants.DEFAULT_ARTHUR_DRIVE_FILE_PATH, `${process.env.S3_LOCATION}-${process.env.BUCKET_NAME}`)

    // const size = fileSize.ContentLength > (1 * 1024 * 1024 * 1024)
    //     ? fileSize.ContentLength / (1 * 1024 * 1024 * 1024)
    //     : fileSize.ContentLength > (1 * 1024 * 1024)
    //         ? fileSize.ContentLength / (1 * 1024 * 1024)
    //         : fileSize.ContentLength / (1 * 1024)

    // const sizeCategory = fileSize.ContentLength > (1 * 1024 * 1024 * 1024) ? 'GB' : fileSize.ContentLength > (1 * 1024 * 1024) ? 'MB' : 'KB'

    // let defaultAssetParams = {
    //     assetType: DriveAsset.CONSTANTS.ASSET_TYPES.FILE,
    //     name: 'arthur-logo',
    //     assetOwner: user._id,
    //     createdBy: user._id,
    //     size: size,
    //     sizeCategory: sizeCategory,
    //     extension: '.jpg',
    //     assets: []
    // }

    // let defaultDriveAsset = await DriveAsset.create(defaultAssetParams)
    // userDriveAsset.assets.push(defaultDriveAsset._id)
    // await userDriveAsset.save()

    // await multimedia.copyFile(process.env.BUCKET_NAME, process.env.S3_LOCATION, process.env.S3_LOCATION,
    //     globalConstants.DEFAULT_ARTHUR_DRIVE_FILE_PATH,
    //     `${DriveAsset.CONSTANTS.ASSET_FOLDER_KEY}/${defaultDriveAsset._id}.jpg`)

    user.drives = [userDrive._id]
    await user.save()
}
module.exports = mongoose.model('Drive', DriveSchema)
