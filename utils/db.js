/* eslint-disable no-undef */
const mongoose = require('mongoose');
require('dotenv').config()

const dbURL = process.env.Mongo_URI || ""

const connectDB = async () => {
    try {
        await mongoose.connect(dbURL).then((res) => {
            console.log("Connected " + res.connection.host)
        })
    } catch (error) {
        console.log(error?.message)
        setTimeout(() => {
            connectDB
        }, 5000)
    }
}

module.exports = connectDB

