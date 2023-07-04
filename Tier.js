const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TierSchema = new Schema({
    tierName: String,
    tierKey: String,
    availableEnvironments: [String],
    instancesOfEnvironment: Number,
    isRenamingOfRoomsAllowed: Boolean,
    isDeletingOfRoomsAllowed: Boolean,
    canCreateNewRoom: Boolean,
    canDuplicateRoom: Boolean,
    isPwProtectedRoomsAllowed: Boolean,
    isCreateHyperlinksAllowed: Boolean,
    maximumTeamMembers: Number,
    numberOfConsecutiveTeams: Number,
    guestsInRoomViaInvite: Number,
    isInviteNonArthurUsersAllowed: Boolean,
    isArthurViewerAllowed: Boolean,
    isArthurDesktopVRAllowed: Boolean,
    isFullBodyAvatarsAllowed: Boolean,
    fileUploadLimitPerRoom: Number,
    fileFormats: [{
      type: String,
        enum: ['PPTX', 'PDF', 'PNG', 'GLTF']
    }],
    fileExport: [{
      type: String,
      enum: ['EMAIL', 'LOCAL_DEVICE', 'THIRD_PARTY_SERVICES']
    }],
    isArthurDriveAllowed: Boolean,
    arthurDriveLimit: Number,
    isSharedArthurDriveAllowed: Boolean,
    isWhiteBoardsAllowed: Boolean,
    isShapesAllowed: Boolean,
    isTextLablesAllowed: Boolean,
    isTimerAllowed: Boolean,
    annotations: [{type: String, enum: ['TEXT', 'AUDIO']}],
    isPersonalNotesAllowed: Boolean,
    isScreenshotsAllowed: Boolean,
    browser: [{type: mongoose.Schema.Types.ObjectId, ref: "Client"}],
    isGoogleDriveAllowed: Boolean,
    isSharepointStorageAllowed: Boolean,
    isGooglePolyAllowed: Boolean,
    isJirallowed: Boolean,
    isTrelloAllowed: Boolean,
    isSharepointAllowed: Boolean,
}, { collection: 'tiers' })


module.exports = mongoose.model('Tier', TierSchema)