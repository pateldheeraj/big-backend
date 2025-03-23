import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler ( async (req , res)=> {
    
    const {fullName,email,password,username} =req.body

    if (
        [fullName,email,username,password].some((filed)=> filed?.trim() === "")
    ) {
        throw new ApiError(400,"All fields are required")
    }

    const userExists = User.findOne({
        $or: [ { username },{ email } ]
    })

    if (!userExists) {
        throw new ApiError(409,"User with this Email or username already exists")
    }

     const avatarLocalPath = req.files?.avatar[0]?.path;
     const coverImageLocalPath = req.files?.coverImage[0]?.path;

     if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required"); 
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

export {registerUser}