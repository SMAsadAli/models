// Require Mongoose
const mongoose = require("mongoose");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
var crypto = require("crypto");
const { v4 } = require("uuid");
const util = require("../helpers/util");
const mailer = require("../helpers/mailer");
const ENV_CONSTANTS = require("../config/envs");
const Provider = require("./Provider");
const RolePermission = require("./RolePermission");
const multimedia = require("../helpers/multimedia");
const auth = require("../helpers/auth");
const OAuthTwo = require("./OAuthTwo");
const UserDevice = require("./UserDevice");
const { AVATAR_STATUS, DEFAULT_BOOKMARKS } = require("../config/globalConstants");
const BookMark = require('./BookMark')
const UserRole = require("./userRolesAndFeatures/UserRole");
const globalConstants = require("../config/globalConstants");
const { AVATAR_RESOLUTION } = require("../services/avatarResolution.enum");

require("dotenv").config();
// require.extensions['.html'] = function (module, filename) {
//   module.exports = fs.readFileSync(filename, 'utf8');
// };

// Define a schema
var Schema = mongoose.Schema;

function encrypt(text) {
  if (text === null || typeof text === "undefined") {
    return text;
  }
  var cipher = crypto.createCipheriv(
    "aes-256-cbc",
    process.env.SERVER_KEY,
    process.env.SERVER_IV
  );
  var crypted = cipher.update(text, "utf8", "hex");
  crypted += cipher.final("hex");
  return "enc:-" + crypted;
}

function decrypt(text) {
  if (
    text === null ||
    typeof text === "undefined" ||
    !text.startsWith("enc:-")
  ) {
    return text;
  }
  var decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    process.env.SERVER_KEY,
    process.env.SERVER_IV
  );
  var dec = decipher.update(text.slice(5), "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

var UserProviderSchema = new Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
  accessToken: { type: String, get: decrypt, set: encrypt },
  refreshToken: { type: String, get: decrypt, set: encrypt },
  idToken: { type: String, get: decrypt, set: encrypt },
  email: String,
  userIdentity: String,
  key: String,
  resource: String,
  teamId: String,
  miroUserId: String,
  teamName: String,
  teamImageURL: String,
  token: String,
  tokenSecret: String,
  verificationCode: String,
  dateTimeConnected: String,
  accessTokenUpdatedAt: Date,
  providerName: String,

});

UserProviderSchema.set("toObject", { getters: true });
UserProviderSchema.set("toJSON", { getters: true });

var UserFavoriteSchema = new Schema({
  userProviderId: { type: mongoose.Schema.Types.ObjectId },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
  providerName: String,
  assetId: String,
  assetName: String,
  assetParams: { type: mongoose.Schema.Types.Object },
});

var UserSchema = new Schema(
  {
    email: String,
    first_name: String,
    last_name: String,
    password: String,
    client: String,
    companyCreationStep: String,
    invitedEmployees: Array,
    clients: [{ type: mongoose.Schema.Types.ObjectId, ref: "Client" }],
    s3location: String,
    avatarType: String,
    avatarSettings: {
      type: String,
      default:
        '{"AvatarType":"HalfBody","UserScale":1.0,"AvatarHead":"Default","LeftArmScale":0.0,"RightArmScale":0.0,"UserGender":"Male","PlayerShirt":"Blue1","AvatarFullBodyType":"Suit2","BodyHeight":180}',
    },
    userSettings: { type: String, default: "" },
    fullBodyAvatar: { type: String, default: "" },
    fullBodyAvatarV2: String,
    fullBodyAvatarV2HF: String,
    salt: String,
    hasToken: Boolean,
    emailVerified: Boolean,
    hasPic: Boolean,
    isLocked: { type: Boolean, default: false },
    failedLoginTries: { type: Number, default: 0 },
    lastFailedLoginTimeStamp: { type: Date, default: Date.now() },
    arthurRole: { type: mongoose.Schema.Types.ObjectId, ref: "ArthurRole" },
    hasSizes: Boolean,
    profilePic: String,
    uncroppedProfilePicture: String,
    avatarPic: String,
    picExtension: String,
    avatarStatus: {
      type: String,
      enum: AVATAR_STATUS.statusesEnum,
    },
    avatarStatusHF: {
      type: String,
      enum: AVATAR_STATUS.statusesEnum,
    },
    role: String,
    avatarFailedReason: String,
    token: String,
    passwordResetToken: { type: String, default: "" },
    passwordResetTimeStamp: String,
    tz: String,
    recentFiles: Array,
    featuresSupported: Array,
    drives: [{ type: mongoose.Schema.Types.ObjectId, ref: "Drive" }],
    providers: [UserProviderSchema],
    favorites: [UserFavoriteSchema],
    loginHistory: { type: Array, default: [] },
    recoveryCodes: Array,
    mfaEnabled: Boolean,
    mfaSecret: String,
    recentTotpCodes: { type: Array, default: [] },
    prevPasswords: [
      { type: mongoose.Schema.Types.ObjectId, ref: "PreviousPassword" },
    ],
    userDevices: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserDevice" }],
    userTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
    userTeamsRoles: [
      {
        team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
        teamRole: { type: mongoose.Schema.Types.ObjectId, ref: "TeamRole" },
      },
    ],
    userOrganizationsRoles: [
      {
        organization: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
        organizationRole: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "OrganizationRole",
        },
      },
    ],
    userRole: { type: mongoose.Schema.Types.ObjectId, ref: "UserRole" },
    firstSignIn: Boolean,
    isCallout: Boolean,
    isComplianceUser: { type: Boolean, default: false },
    isEnterpriseSignIn: Boolean,
    defaultUserRole: {
      type: mongoose.Schema.Types.ObjectId,
    },
    showTutorialOnNextRoomJoin: {
      type: Boolean,
      default: false,
    },
    ssoClient: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  },
  { collection: "user" }
);

UserSchema.pre("save", async function () {
  if (!this.defaultUserRole) {
    const defaultUser = await UserRole.findOne({
      key: globalConstants.USER_ROLES.FULL_ARTHUR_USER,
    });
    this.defaultUserRole = defaultUser?._id;
  }
});

UserSchema.set("timestamps", true);
UserSchema.set("toObject", { getters: true });
UserSchema.set("toJSON", { getters: true });

UserSchema.statics.CONSTANTS = {
  FIELDS: {
    EMAIL: "email",
    PASSWORD: "password",
    FIRST_NAME: "first_name",
    LAST_NAME: "last_name",
    CLIENT: "client",
    S3_LOCATION: "s3location",
    AVATAR_TYPE: "avatarType",
    AVATAR_SETTINGS: "avatarSettings",
    FULL_BODY_AVATAR: "fullBodyAvatar",
    SALT: "salt",
    HAS_TOKEN: "hasToken",
    TOKEN: "token",
    TZ: "tz"
  },
  PARAMS: {
    USER_ID: "userId",
    EMAIL: "email",
    PASSWORD: "password",
    FIRST_NAME: "firstName",
    LAST_NAME: "lastName",
    ORGANIZATION: "organization",
    CLIENT: "client",
    S3_LOCATION: "s3location",
    AVATAR_TYPE: "avatarType",
    AVATAR_SETTINGS: "avatarSettings",
    FULL_BODY_AVATAR: "fullBodyAvatar",
    TOKEN: "token",
    USER_PROVIDER_ID: "userProviderId",
    ASSET_ID: "assetId",
    ASSET_NAME: "assetName",
    ASSET_PARAMS: "assetParams",
  },
  PROVIDERS_LIMIT: 5,
  MAXFAILEDLOGINATTEMPTS: 6,
  LOCKEDTIME: 5
};

UserSchema.statics.isTokenValid = async function (user, token) {
  // first get userDeviceId from token and then find
  const accessTokenVerification = await jwt.verify(
    token,
    process.env.APP_SECRET
  );
  if (
    accessTokenVerification.err ||
    new Date(accessTokenVerification.exp) < new Date()
  ) {
    return false;
  }
  const userDevice = user.userDevices.find(
    (ud) => ud.userDeviceId === accessTokenVerification.data.userDeviceId
  );
  if (!user || !userDevice || userDevice.oAuthTwo.accessToken !== token) {
    return false;
  }
  const resfreshTokenVerification = await jwt.verify(
    userDevice.oAuthTwo.refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  if (
    resfreshTokenVerification.err ||
    new Date(resfreshTokenVerification.exp) < new Date()
  ) {
    return false;
  }
  return true;
};

UserSchema.statics.isTokenIssued = function (user) {
  return user.hasToken;
};

UserSchema.statics.sendWelcomeEmail = function (
  userEmail,
  fullName,
  userType = "enterprise"
) {
  const welcomeTemplate =
    userType === "enterprise"
      ? require("../templates/arthur-welcome-email.html")
      : require("../templates/store-user-welcome-email.html");
  const portalLink = ENV_CONSTANTS.newPortalUrl;

  const data = {
    email: userEmail,
    name: fullName,
    ViewPortalLink: portalLink,
    portalLink,
  };
  const welcomeHtml = util.replacer(welcomeTemplate, data);
  mailer.sendEmail(
    userEmail,
    process.env.EMAIL_USERNAME,
    "Welcome to Arthur",
    null,
    welcomeHtml
  );
};

UserSchema.statics.sendVerificationEmail = function (
  userId,
  userEmail,
  username,
  teamId
) {
  var verificationTemplate = require("../templates/confirm-email.html");
  const teamIdQuery = teamId ? `&&teamId=${teamId}` : "";
  const userIdQuery = userId ? `verificationCode=${userId}` : "";
  let verifyLink = `${ENV_CONSTANTS.verifyUrl}?${userIdQuery}${teamIdQuery}`;
  let data = {
    username: username,
    userEmail: userEmail,
    verifyLink: verifyLink,
    verifyLinkDisplay: verifyLink,
    verifyLinkConfirm: verifyLink,
  };
  let verificationHtml = util.replacer(verificationTemplate, data);
  mailer.sendEmail(
    userEmail,
    `"Arthur Technologies Inc." <${process.env.EMAIL_USERNAME}>`,
    "Confirm your email address on Arthur",
    null,
    verificationHtml
  );
};


UserSchema.statics.addDefaultBookMarksToUser = function (
  userId
) {
  const promises = DEFAULT_BOOKMARKS.map((x) => {
    const bookMark = new BookMark({ ...x, userId })
    return bookMark.save()
  })
  return Promise.all(promises);
};

UserSchema.statics.sendProfilePicEmail = function (imageData, user) {
  mailer.sendEmail(
    "wasay@arthur.digital",
    process.env.EMAIL_USERNAME,
    `Profile Pic of user ${user.name} , email ${user.email} and team ${user.team}`,
    null,
    null,
    [
      {
        filename: user.name + ".png",
        content: imageData,
      },
    ],
    []
  );
};

UserSchema.statics.processLoggedInUser = async (
  user,
  client,
  userDeviceId,
  headers,
  signInV2,
  userDeviceType,
  staySignIn = false
) => {
  let userCurrentDeviceOauth = {};
  const foundDevice = user.userDevices.find(
    (ud) => ud.userDeviceId === userDeviceId
  );
  if (!foundDevice) {
    const userDeviceObject = {
      userDeviceId: v4(),
      ...userDeviceType && { userDeviceType }
    };

    let accessTokenObj = await auth.generateAccessToken(
      user.email,
      user._id,
      userDeviceObject.userDeviceId,
      userDeviceObject.userDeviceType,
      staySignIn
    );
    const oAuthTwoObj = {
      ...accessTokenObj,
    };
    let newOAuthTwoObj = new OAuthTwo(oAuthTwoObj);
    const savedOAuthTwo = await newOAuthTwoObj.save();
    userDeviceObject.oAuthTwo = savedOAuthTwo;
    userDeviceObject.userId = user._id;
    let newUserDevice = new UserDevice(userDeviceObject);
    const savedUserDevice = await newUserDevice.save();
    user.userDevices = [...user.userDevices, savedUserDevice];
    userCurrentDeviceOauth = {
      userDeviceId: savedUserDevice.userDeviceId,
      oAuthTwo: savedOAuthTwo,
    };
  } else {
    let accessTokenObj = await auth.generateAccessToken(
      user.email,
      user._id,
      foundDevice.userDeviceId,
      foundDevice.userDeviceType || userDeviceType,
      staySignIn
    );
    const oAuthTwoObj = {
      ...accessTokenObj,
    };
    let newOAuthTwoObj = new OAuthTwo(oAuthTwoObj);
    const savedOAuthTwo = await newOAuthTwoObj.save();
    userCurrentDeviceOauth = { userDeviceId };
    userCurrentDeviceOauth.oAuthTwo = savedOAuthTwo;
    await UserDevice.updateOne(
      { userDeviceId: userDeviceId },
      { oAuthTwo: savedOAuthTwo._id }
    );
  }
  user.hasToken = true;

  if (!user.hasPic) {
    await multimedia.copyFile(
      process.env.BUCKET_NAME,
      user.s3location,
      user.s3location,
      process.env.S3_ENV_KEY +
        "/" +
        "common/" +
        process.env.PROFILE_PIC_FOLDER +
        "/" +
        process.env.TEMPLATE_PROFILE_PIC,
      process.env.S3_ENV_KEY +
        "/" +
        "common/" +
        process.env.PROFILE_PIC_FOLDER +
        "/" +
        user._id.toString() +
        ".png"
    );
    user.hasPic = true;
    user.picExtension = ".png";
  }
  await user.save();
  user.client = JSON.stringify(
    _.find(user.clients, (clientObj) => {
      return clientObj.key === client.key;
    })
  );

  for (let provider of user.providers) {
    let providerInfo = await Provider.findOne({
      _id: provider.provider,
    }).select("key");
    provider.key = providerInfo.key;
  }

  if (user.fullBodyAvatar || user.fullBodyAvatarV2) {
    let testPlatform = headers["user-agent"].includes(
      process.env.ARTHUR_DESKTOP_AGENT
    )
      ? "StandaloneWindows"
      : "Android";
    let avatarSettings = JSON.parse(user.avatarSettings);

    let key = "AssetBundles/";
    const avatarKey = signInV2
      ? user?.fullBodyAvatarV2?.toLowerCase()
      : user.fullBodyAvatar.toLowerCase();
    let headExists = await multimedia.checkVersion(
      key + testPlatform + "/" + avatarKey + ".avatar",
      user.s3location
    );

    avatarSettings.AvatarType = headExists
      ? avatarSettings.AvatarType
      : "HalfBody";
    user.avatarSettings = JSON.stringify(avatarSettings);
  } else {
    let avatarSettings = JSON.parse(user.avatarSettings);
    avatarSettings.AvatarType = "HalfBody";
    user.avatarSettings = JSON.stringify(avatarSettings);
  }
  await user.save();

  // TODO: RUN  Query in DEV when unified code is deployed on dev/enterprise

  // const isMatched = util.isRoleInCommon(user.arthurRole.key)
  // let roles = await RolePermission.find({
  //   key: isMatched ? user.role : "user",
  // });

  /** Profile Pic and Avatar Url Code */
  const {profilePicData, avatarData} = await getUserProfileAndAvatarData(user,client.key)

  return [user, userCurrentDeviceOauth, profilePicData, avatarData];
};

const getUserProfilePicData = async (user, clientKey) => {
  const profilePicData = {
    orignal: await multimedia.getProfilePictureCloudFrontUrl(
      user._id,
      "common",
      user.s3location,
      user.picExtension,
      false
    ),
    client: await multimedia.getProfilePictureCloudFrontUrl(
      user._id,
      clientKey,
      user.s3location,
      user.picExtension,
      false
    ),
  };

  await Promise.all(
    globalConstants.ALLOWED_PIC_SIZES.map(async (size) => {
      profilePicData[size] = await multimedia.getProfilePictureCloudFrontUrl(
        `${user._id}-${size}`,
        "common",
        user.s3location,
        user.picExtension,
        false
      );
    })
  );
  return profilePicData;
};

const getUserAvatarData = async (user) => {
  const platforms = ["Android", "StandaloneWindows", "WebGL"];
  const avatarData = {
    fullBodyAvatar: {},
    fullBodyAvatarV2: {},
    fullBodyAvatarV2HF: {},
  };

  const folderName = "AssetBundles";
  const avatarExtension = ".avatar";
  const crcExtension = ".manifest";

  await Promise.all(
    Object.keys(avatarData).map(async (key) => {
      if (user[key]) {
        await Promise.all(
          platforms.map(async (platform) => {
            avatarData[key][platform] = {};
            const baseKey = key.includes("HF")
              ? `${folderName}/${AVATAR_RESOLUTION.HF}`
              : `${folderName}`;
            const url = `${baseKey}/${platform}/${user[key]}${avatarExtension}`;
            const crcFileUrl = `${url}${crcExtension}`;
            [
              avatarData[key][platform].fileUrl,
              avatarData[key][platform].crcFileUrl,
            ] = await Promise.all([
              await multimedia.getMiscFileCloudFrontUrl(
                url,
               user.s3location,
               false
              ),
              await multimedia.getMiscFileCloudFrontUrl(
                crcFileUrl,
                user.s3location,
                false
              ),
            ]);
          })
        );
      }
    })
  );

  return avatarData;
};

const getUserProfileAndAvatarData = async (user, clientKey) => {
  const [profilePicData, avatarData] = await Promise.all([
    getUserProfilePicData(user, clientKey),
    getUserAvatarData(user),
  ]);
  return { profilePicData, avatarData };
};

UserSchema.statics.getUserProfileAndAvatarData = getUserProfileAndAvatarData;
UserSchema.statics.sendPasswordResetEmail = function (
  token,
  userEmail,
  username,
  isNewPortal
) {
  var resetPasswordTemplate = require("../templates/reset-password-email.html");
  const urlType = !isNewPortal
    ? ENV_CONSTANTS.oldResetUrl
    : ENV_CONSTANTS.newPortalResetUrl;
  let verifyLink = urlType + token;
  let data = {
    verificationLinkText: verifyLink,
    verificationLink: verifyLink,
    verificationButtonLink: verifyLink,
  };
  let resetHtml = util.replacer(resetPasswordTemplate, data);
  mailer.sendEmail(
    userEmail,
    process.env.EMAIL_USERNAME,
    "Arthur Reset Password",
    null,
    resetHtml
  );
};

UserSchema.statics.getUserTeams = async (query, User) => {
  const user = await User.findOne(query);
  if (user && user.userTeams) {
    return user.userTeams.length;
  }
  return 0;
};

UserSchema.statics.getNumberOfTierTeams = async (query, User) => {
  const user = await User.findOne(query, { email: 1 }).populate({
    path: "userTeams",
    select: "teamName -_id",
    populate: { path: "tier", select: "tierName -_id" },
  });
  const userTeams =
    user && user.userTeams && user.userTeams.length
      ? user.userTeams.reduce((acc, o) => {
        return (acc[o.tier.tierName] = (acc[o.tier.tierName] || 0) + 1), acc;
      }, {})
      : { Free: 0, Pro: 0 };
  return userTeams;
};

UserSchema.statics.mapNonInvitedUsers = async (User, nonActiveUsersObject) => {
  const nonActiveUsersIds = Object.keys(nonActiveUsersObject) 
  const nonActiveDBUsers = nonActiveUsersIds.length > 0
    ? await User.find({ _id: nonActiveUsersIds}).select('first_name email picExtension last_name profilePic').lean().exec() : [];
  const mappedUsers = []
  if(nonActiveDBUsers.length> 0){
    nonActiveDBUsers.forEach((user) => {
      const userJson = JSON.parse(nonActiveUsersObject[user._id.toString()]);
      if (userJson) {
        const { lastSeen, userRole } = userJson;
        const lastSeenDate = new Date(lastSeen * 1000);
        const minutes = lastSeenDate.getMinutes()
        const lastSeenHoursMins = `${lastSeenDate.getHours()}:${minutes < 10  ? `0${minutes}` : minutes}`;
        const updatedUser = {
          lastSeen: lastSeenHoursMins,
          lastSeenEpoch: lastSeen,
          userRole,
          ...user,
        };
        mappedUsers.push(updatedUser);
      }
    });
  }
  return mappedUsers;
};
module.exports = mongoose.model("User", UserSchema);
