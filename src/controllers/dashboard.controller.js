import mongoose,{isValidObjectId} from "mongoose"
import {Video} from '../models/video.model.js'
import {Subscription} from '../models/subscription.model.js'
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import {Like} from '../models/like.model.js'
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id

    const totalVideo = await Video.countDocuments({owner:userId})

    if(totalVideo==null || totalVideo ==undefined){
        throw new ApiError(500, "Something went wrong while displaying total videos")
    }

    const totalSubscribers = await Subscription.countDocuments({channel : userId})

    if(totalSubscribers === null || totalSubscribers === undefined){
        throw new ApiError(500, "Something went wrong while displaying total subscribers")
    }

    const totalVideoLikes = await Like.countDocuments({
        video : {
            $in : await Video.find({owner:userId}).distinct("_id")
        }
    })

    if(totalVideoLikes === null || totalVideoLikes === undefined){
        throw new ApiError(500, "Something went wrong while displaying total video Likes")
    }

    const totalTweetLikes = await Like.countDocuments({
        tweet: {
          $in: await Tweet.find({ owner: userId }).distinct("_id"),
        },
      });
    
      if (totalTweetLikes === null || totalTweetLikes === undefined) {
        throw new ApiError(
          500,
          "Something went wrong while displaying total tweet likes"
        );
      }

      const totalCommentLikes = await Like.countDocuments({
        comment: {
          $in: await Comment.find({ owner: userId }).distinct("_id"),
        },
      });
    
      if (totalCommentLikes === null || totalCommentLikes === undefined) {
        throw new ApiError(
          500,
          "Something went wrong while displaying total comment likes"
        );
      }

      const totalViews = await Video.aggregate([
        {
            $match : {
                owner : userId
            }
        },{
            $group : {
                _id : null,
                totalViews : {$sum : "$views"}
            }
        }
      ])

      if (totalViews === null || totalViews === undefined) {
        throw new ApiError(
          500,
          "Something went wrong while displaying total views"
        );
      }

       return res.status(200).json(
        new ApiResponse(
          200,
          {
            totalVideo,
            totalSubscribers,
            totalVideoLikes,
            totalTweetLikes,
            totalCommentLikes,
            totalViews: totalViews[0]?.totalViews || 0, // Default to 0 if no views are found
          },
          "Channel stats fetched successfully"
        )
      );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id

    const totalVideos = await Video.countDocuments({owner : userId}).sort({
        createdAt : -1
    })

    if(!totalVideos || totalVideos.length=== 0 ){
        throw new ApiError(
            500,
            "NO videos Found for this channel"
        )
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        totalVideos,
        "Total videos fetch successfully"
    ))
})

export {
    getChannelStats,
    getChannelVideos
}
