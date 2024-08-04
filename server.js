const connectDB = require('./utils/db.js')
const app = require('./app.js')
const cloudinary = require('cloudinary')
require('dotenv').config();


// cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API,
    api_secret: process.env.CLOUD_SECRET
})

// Create server
// eslint-disable-next-line no-undef
app.listen(process.env.PORT || 8000, () => {
    console.log("Server Running")
    connectDB()
})

