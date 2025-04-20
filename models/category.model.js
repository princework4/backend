const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')

const categorySchema = new mongoose.Schema({
    title :String
})


const categoryModal = mongoose.model('Category', categorySchema)
module.exports = categoryModal
