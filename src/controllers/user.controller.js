import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
        $or : [username,email]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await User.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken,refreshToken} = generateAccessAndRefershToken(user._id)

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

export {
    registerUser,
    loginUser,
    logoutUser
}