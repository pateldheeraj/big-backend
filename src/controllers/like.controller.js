import {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404,"Invalid VideoID")
    }

    const isVideo = await Video.findOne({_id:videoId})

    if(!isVideo){
        throw new ApiError(404,"Video is not found with this ID")
    }

    const existingLike = await Like.findOne({
        video:videoId,
        likedBy:req.user?._id})
        console.log(existingLike);
        
        if(existingLike){
            await Like.findByIdAndDelete(existingLike._id)
            return res
            .status(200)
            .json(new ApiResponse(200, existingLike, "Video unliked successfully"));
        }

        const likeVideo = await Like.create({
            video:videoId,
            likedBy : req.user?._id
        })

        return res
        .status(200)
        .json(new ApiResponse(202,likeVideo,"Video Liked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(404,"Invalid commentId")
    }

    const isComment = await Comment.findOne({_id :commentId})

    if(!isComment){
        throw new ApiError(404,"Comment is not found with this ID")
    }

    const existingComment = await Like.findOne({
        comment:commentId,
        likedBy:req.user?._id})

        if(existingComment){
            await Like.findByIdAndDelete(existingComment._id)
            return res
            .status(200)
            .json(new ApiResponse(200, existingComment, "Comment unliked successfully"));
        }

        const likeComment = await Like.create({
            comment : commentId,
            likedBy : req.user?._id
        })

        return res
        .status(200)
        .json(new ApiResponse(202,likeComment,"Comment Liked successfully"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404,"Invalid TweetId")
    }

    const isTweet = await Tweet.findOne({_id :tweetId})

    if(!isTweet){
        throw new ApiError(404,"Tweet is not found with this ID")
    }

    const existingTweet = await Like.findOne({
        tweet:tweetId,
        likedBy:req.user?._id})

        if(existingTweet){
            await Like.findByIdAndDelete(existingTweet._id)
            return res
            .status(200)
            .json(new ApiResponse(200, existingTweet, "Tweet unliked successfully"));
        }

        const likeTweet = await Like.create({
            tweet : tweetId,
            likedBy : req.user?._id
        })

        return res
        .status(200)
        .json(new ApiResponse(202,likeTweet,"Tweet Liked successfully"))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.find(
        {
            likedBy:req.user?._id,
            video:{$exists:true}
        }
    ).populate("video","_id title url")

    if(!likedVideos){
        throw new ApiError(404,"Liked videos not Found")
    }

    return res 
    .status(200)
    .json(new ApiResponse(202,likedVideos,"Liked video fetch Successfully"))
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}