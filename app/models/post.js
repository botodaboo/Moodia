const mongoose = require('mongoose')
const Schema = mongoose.Schema
const postSchema = new Schema({
    userName: String,
    userID: String,
    postContent: String,
    comment: [{
        userName: String,
        cmtContent: String,
        userID: String,
    }],
    image: String,
    video: String
})

const Post = mongoose.model('Post', postSchema)

module.exports = Post