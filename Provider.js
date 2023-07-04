const moment = require('moment')
// Require Mongoose
var mongoose = require('mongoose')
const auth = require('../helpers/auth')

var Schema = mongoose.Schema

var ProviderSchema = new Schema({
    name: String,
    key: String,
    authStandard:{
        type: String,
        enum: ['OAUTH2']
    },
    enabled: {
        type: Boolean,
        default: false
    },
    providerType:[{
        type: String,
        enum: ['TOOLS', 'STORAGE']
    }],
    appKey: String,
    appId: String,
    appSecretKey: String,
    appSecretValue: String,
    authUrl: String,
    tokenUrl: String,
    requestUrl: String,
    toolUrl: String,
    redirectUrl: String,
    scope: String,
    emailField: String,
    historyId: String,
    emailHistoryUrl: String,
    emailUrl: String,
    watcherUrl: String,
    responseModeRequired: Boolean,
    infoUrl: String,
    storageUrl: String,
    audience: String,
    useAuthUrlOnly: Boolean,
    infoUrlMethod: String,
    multiAccount: Boolean,
    resourceRequired: Boolean,
    projectMapping: Object,
    projectListMapping: Object,
    extraMappings: Object,
    apiKey: String,
    assetMapping: Object,
    taskMapping: Object,
    assigneeMapping: Object,
    multiTaskAssignees: Boolean
}, { collection: 'providers' })

ProviderSchema.statics.CONSTANTS = {
    PARAMS: {
        NAME: 'name',
        KEY: 'key',
        AUTH_STANDARD: 'authStandard',
        ENABLED: 'enabled',
        REDIRECT_URL: 'redirectUrl'
    },
    AUTH_STANDARDS: {
        OAUTH2: 'OAUTH2'
    },
    PROVIDERS: {
        SHAREPOINT: 'sharepoint'
    },
    PROVIDER_TYPES: {
        TOOLS: 'TOOLS',
        STORAGE: 'STORAGE'
    }
}

ProviderSchema.statics.addProvider = async (userId, params, Provider, email) => {
    let provider = await Provider.findOne({ key: params.provider });
    let refreshToken = auth.generateDriveToken({ id: userId, tokenType: 'refresh' }, Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365 * 20))
    let accessToken = auth.generateDriveToken({ id: userId, tokenType: 'access' }, Math.floor(Date.now() / 1000) + (60 * 60 * 2))
    let providerObj = {
      provider: provider._id,
      accessToken: accessToken,
      refreshToken: refreshToken,
      email: email,
      dateTimeConnected: moment().format('DD.MM.YYYY'),
      key: provider.key,
      providerName: provider.name
    }
    console.log(providerObj)
    return providerObj
}

module.exports = mongoose.model('Provider', ProviderSchema)
