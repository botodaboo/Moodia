const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    student: {
        authId: String,
        name: String,
        email: String,
        created: Date,
        faculty: String,
        class: String, 
    },
    
    highuser: {
        username: String,
        password: String,
        name: String,
    },

    permission: [{
        dptname: String,
        dptid: String,
    }],
    role: String,
    avt: String
});

const User = mongoose.model('User', userSchema)

module.exports = User