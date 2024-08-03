const CatchAsyncError = require("../middleware/catchAsyncError");
const redis = require("../utils/redis");

const getUserByID = CatchAsyncError(async (id, res) => {
    const userJSON = await redis.get(id)

    if(userJSON){
        const user = JSON.parse(userJSON)
        res.status(201).json({
            success: true,
            user
        })
    }
})



module.exports = {getUserByID}