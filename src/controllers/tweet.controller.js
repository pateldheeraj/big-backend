import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {Tweet} from '../models/tweet.model.js'
import { isValidObjectId } from "mongoose"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body
    if(!content){
        throw new ApiError(404,"Invalid Content")
    }

    const tweet = await Tweet.create({
        owner : req.user?._id,
        content
    })

    if(!tweet){
        throw new ApiError(401, " Tweet not Found")
    }

    return res 
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet created Successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(404,"UserID is not valid")
    }

    const fetchedTweet = await Tweet.find({owner:userId})

    if (!fetchedTweet) {
        throw new ApiError(404, "Unable to fetch tweet")
    }

    return res 
    .status(200)
    .json(new ApiResponse(202,fetchedTweet,"Tweet fetched Successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
     const {tweetId} = req.params
     const {newContent}=req.body
     
    if(!(isValidObjectId(tweetId))){
        throw new ApiError(404, "Enter a valid tweetID")
    }

    if(!newContent){
        throw new ApiError(404,"Invalid newContent")
    }
    
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404,"Tweet not Found")
    }
     console.log(req.user?._id,tweet.owner);
     
    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401,"You can Only Update Your Tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,{
        $set : {content : newContent}
    },{new : true})

    if (!updatedTweet) {
        throw new ApiError(401,"Unable to Update Tweet")
    }

    return res 
    .status(200)
    .json(new ApiResponse(200,updatedTweet,"Tweet Updated Successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404,"Invalid TweetId")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(401,"Tweet not Found")
    }

    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401,"You can Only Deleted Your Tweet")
    }


    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if (!deletedTweet) {
        throw new ApiError(404, "Incorrect TweetID")
    }

    return res 
    .status(200)
    .json(new ApiResponse(200,deletedTweet,"Tweet deleted successfully"))
})

export{
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}