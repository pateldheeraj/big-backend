import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefershToken =  async(userId) => {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
}

const registerUser = asyncHandler ( async (req , res)=> {
    
    const {fullName,email,password,username} =req.body

    if (
        [fullName,email,username,password].some((filed)=> filed?.trim() === "")
    ) {
        throw new ApiError(400,"All fields are required")
    }

    const userExists = await User.findOne({
        $or: [ { username },{ email } ]
    })

    if (userExists) {
        throw new ApiError(409,"User with this Email or username already exists")
    }

    const avatarLocalPath =  req.files?.avatar[0]?.path;
    // const coverImageLocalPath =  req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

     if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required please"); 
     }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required" )
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

     const createdUser= await User.findById(user._id).select(
        "-password -refershToken"
     )

     if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering User")
     }

     return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Succesfully")
     )
})

const loginUser = asyncHandler ( async ( req, res ) => {

    const { username ,email ,password } = req.body

    if (!(username || email)) {
        throw new ApiError(400 , "Username or Email is required")
    }
    
    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefershToken(user._id)
       
    const userLoggedIn = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {user : userLoggedIn , accessToken , refreshToken},
            "User logged In succesfully"
        )
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set : {accessToken : undefined}
            
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler( async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.accessToken

    if (!incomingRefreshToken) {
        throw new ApiError(401 , "Unautorized Access")
    }

    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFERSH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if (!user) {
        throw new ApiError(401, "Invalid refresh token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const {newRefreshToken,accessToken} = await generateAccessAndRefershToken(user._id)

    return res
    .status(200)
    .cookie("accessToken",accessToken)
    .cookie("refershToken", newRefreshToken)
    .json(
        new ApiResponse(200,{accessToken,refreshToken : newRefreshToken},"access token refreshed")
    )
})

const changeCurrentPassword = asyncHandler( async (req, res) => {

    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id)

    isPasswordTrue = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordTrue) {
        throw new ApiError(400 , "Inavlid Old Password")
    }

    user.password = newPassword
    user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Change succesfully"))
} )

const getCurrentUser = asyncHandler (async (req,res) => {
    return res
    .status(200)
    .json(new ApiResponse (200,req.user,"Current User Fetch Succesfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {

    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

   const user = await User.findByIdAndUpdate(req.user?._id,
    {
        $set : {
            fullName,
            email
        }
    }
    ,{new :true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user , "Account deatils Succesfully"))

})

const updateUserAvatar = asyncHandler(async (req , res) => {

    const avatarLocalPath = req.file?.path

   if(!avatarLocalPath){
    throw new ApiError(401, "Avatar file is missing")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if (!avatar.url) {
       throw new ApiError(400, "Error while uploading on avatar")
   }

   const user = await User.findByIdAndUpdate(req.user._id,{
    $set : {
        avatar : avatar.url
    }
   },{new : true}).select("-password")

   return res
   .status(200)
   .json(
       new ApiResponse(200, user, "Avatar image updated successfully")
   )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {

        const coverImageLocalPath = req.file?.path

        if (!coverImageLocalPath) {
            throw new ApiError(400, "COverImage file is missing")
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if (!coverImage.url) {
            throw new ApiError(400, "Error while uploading on coverimage")
        }

        const user = await User.findByIdAndUpdate(req.user._id,{
            $set : {
                coverImage : coverImage.url
            }
           },{new : true}).select("-password")
        
           return res
           .status(200)
           .json(
               new ApiResponse(200, user, "coverImage  updated successfully")
           )
})

const getUserChannelProfile = asyncHandler (async (req,res) => {
    const {username} = req.params

    if (!username.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match : {username : username?.toLowerCase()}
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as: "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if : { $in : [req.user?._id , "$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                fullName : 1,
                username : 1,
                email : 1,
                isSubscribed : 1,
                channelsSubscribedToCount : 1,
                subscribersCount : 1,
                coverImage : 1,
                avatar : 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"User channel fetched successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}