// Require Mongoose
var mongoose = require('mongoose')
require('dotenv').config()
var util = require('../helpers/util')
const fs = require('fs');
let globalContants = require('../config/globalConstants')

require.extensions['.html'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

// Define a schema
var Schema = mongoose.Schema

var BrowserShortcutSchema = new Schema({
    name: String,
    url: String,
    key: String,
    value: String,
    imageName: String
}, { collection: 'browser_shortcuts' })

BrowserShortcutSchema.statics.getBrowserHtml = async (user, shortcuts, isDef, client) => {

    var browserTemplate = require('../templates/browserTemplate.html')
    var shortcutTemplate = require('../templates/shortcutTemplate.html')

    let finalContent = ''
    for (let shortcut of shortcuts) {
        let trimmedUrl = shortcut.url;
        if (shortcut.url.length > globalContants.MAX_BROWSER_URL_LENGTH) {
            trimmedUrl = trimmedUrl.slice(0, globalContants.MAX_BROWSER_URL_LENGTH) + '...'
        }
        let image = ''
        // if (isDef) {
        //     image = "https://" + user.s3location + "-" + process.env.BUCKET_NAME + ".s3.amazonaws.com/env-develop/" + "common" + "/" + process.env.BROWSER_SHORTCUTS_IMAGES_FOLDER + "/" + shortcut.imageName

        image = "https://" + user.s3location + "-" + process.env.BUCKET_NAME + ".s3.amazonaws.com/" + process.env.S3_ENV_KEY + "/common/" + process.env.BROWSER_SHORTCUTS_IMAGES_FOLDER + "/" + shortcut.imageName
        // }
        let data = {
            url: shortcut.url,
            shortcutName: shortcut.name,
            image: image,
            urlDisplay: trimmedUrl
        }
        let shortcutContent = util.replacer(shortcutTemplate, data)
        finalContent += shortcutContent
    }
    let finalData = {
        content: finalContent
    }

    let browserContent = util.replacer(browserTemplate, finalData)
    return browserContent
}

BrowserShortcutSchema.statics.CONSTANTS = {
    PARAMS: {
        NAME: 'name',
        URL: 'url',
        KEY: 'key',
        VALUE: 'value',
        IMAGE_NAME: 'imageName',
        FILE: 'file',
    }
}

module.exports = mongoose.model('BrowserShortcut', BrowserShortcutSchema)
