// Require Mongoose
const mongoose = require('mongoose');
const util = require("../helpers/util")
// Define a schema
const Schema = mongoose.Schema

const BookMarkSchema = new Schema({
    name: String,
    url: String,
    iconUrl: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { collection: 'book_marks' })

BookMarkSchema.statics.getBrowserHtml = async (token) => {
    const bookMarkTemplate = require('../templates/bookMarkTemplate.html');
    const data = {
        accessToken: token,
        baseUrl: process.env.BASE_URL
    };
    const browserContent = util.replacer(bookMarkTemplate, data)
    return browserContent
}

module.exports = mongoose.model('BookMark', BookMarkSchema)
