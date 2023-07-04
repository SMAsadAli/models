const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SSOConfigSchema = new Schema({
  name: String,
  idpUrl: String,
  default: { type: Boolean, default: false },
  credentials: Schema.Types.Object
}, { _id: false });

const ProvidersPermissionsSchema = new Schema({
  jira: { type: Boolean, default: true },
  sharepoint: { type: Boolean, default: true },
  google: { type: Boolean, default: true },
  trello: { type: Boolean, default: true },
  arthurDrive: { type: Boolean, default: true },
  oneDrive: { type: Boolean, default: true },
  miro: { type: Boolean, default: true },
}, { _id: false });

const ClientSchema = new Schema(
  {
    name: String,
    key: String,
    clientCode: String,
    region: String,
    isVerifiable: Boolean,
    companyName: String,
    status: String,
    mfaAllowed: Boolean,
    enableAppstream: Boolean,
    enableVideoBroadcast: Boolean,
    enableWebGL: Boolean,
    enableScreenShare: Boolean,
    enableJoinAudio: Boolean,
    isTemplatesAllowed: Boolean,
    ipAddress: String,
    fleetName: String,
    stackName: String,
    port: String,
    providers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Provider" }],
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
    templates: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    organizationType: { type: mongoose.Schema.Types.ObjectId, ref: "OrganizationType" },
    isTeamsAllowed: Boolean,
    brandColors: Array,
    shortName: String,
    organizationOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    enableSSO: { type: Boolean, default: false },
    enableRemoteAccess: { type: Boolean, default: false },
    ssoConfig: [SSOConfigSchema],
    providersPermissions: ProvidersPermissionsSchema,
    enableMiro: Boolean
  },
  { collection: "clients" }
);

ClientSchema.index({
  name: 1,
  key: 1,
});

ClientSchema.statics.CONSTANTS = {
  PARAMS: {
    CLIENT_NAME: "name",
    CLIENT_KEY: "key",
    CLIENT_LOGO: "clientLogo",
    CLIENT_REGION: "region",
    COMPANY_NAME: "companyName",
    MFA_ALLOWED: "mfaAllowed",
    ENABLE_APPSTREAM: "enableAppstream",
    ENABLE_VIDEO_BROADCAST: "enableVideoBroadcast",
    ENABLE_WEBGL: "enableWebGL",
    ENABLE_SCREEN_SHARE: "enableScreenShare",
    ENABLE_JOIN_AUDIO: "enableJoinAudio",
    ENABLE_MIRO: "enableMiro",
    FLEET_NAME: "fleetName",
    STACK_NAME: "stackName",
    IS_TEAMS_ALLOWED: "isTeamsAllowed",
    IP_ADDRESS: "ipAddress",
    PORT: "port",
    SHORT_NAME: "shortName",
    BRAND_COLORS: "brandColors",
    TEMPLATES_CLIENT_KEY: "customertemplates",
    TEMPLATES_POSTFIX: "templates",
    COMMON_TEMPLATES_KEY: "common",
    IS_TEMPLATES_ALLOWED: "isTemplatesAllowed",
    ENABLE_SSO: "enableSSO",
    SSO_CONFIG: "ssoConfig",
    PROVIDERS_PERMISSIONS: "providersPermissions",
    ENABLE_REMOTE_ACCESS: "enableRemoteAccess"

  },
  STATUSES: {
    ACTIVE: "active",
    INACTIVE: "inactive",
  },
};

module.exports = mongoose.model("Client", ClientSchema);
