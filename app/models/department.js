const mongoose = require('mongoose')
const departmentSchema = mongoose.Schema({
    name: String,
})

const Department = mongoose.model('Department', departmentSchema)

module.exports = Department;
