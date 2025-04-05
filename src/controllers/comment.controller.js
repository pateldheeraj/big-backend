import mongoose,{isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404,"Invalid VideoId")
    }

    const comments = await Comment.aggregate([
        {
            $match : {
               video : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "videoOnComment",
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as :"ownerOfComment"
            }
        },
        {
            $project : {
                content : 1,
                video : {
                    $arrayElemAt: ["$videoOnComment",0]
                },
                owner : {
                    $arrayElemAt : ["$ownerOfComment",0]
                },
                createdAt : 1
            }
        },
        {
            $skip : ((page-1)*parseInt(limit))
        },
        {
            $limit : parseInt(limit)
        }
    ])

    if (!comments?.length) {
        throw new ApiError(404,"Comments not Found")
    }
    
    return res 
    .status(200)
    .json(new ApiResponse(200,comments,"Comments fetch Successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Video ID")
    }
    
    if (!content) {
        throw new ApiError(400, "Empty or null fields are invalid");
      }

    const addedComment = await Comment.create({
        content,
        owner : req.user?._id,
        video : videoId
    })

    if(!addedComment){
        throw new ApiError(404,"Unable to add comment")
    }

    return res 
    .status(200)
    .json(new ApiResponse(202,addedComment,"Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404,"Invalid Comment ID")
    }
    if (!content) {
        throw new ApiError(400, "Comment cannot be empty");
      }
    const updatedComment = await Comment.findByIdAndUpdate({
        _id:commentId,
        owner : req.user?._id
    },
    {
        $set :{
            content
        }
    },
    {new:true})

    if(!updatedComment){
        throw new ApiError(404,"Unable to Update comment")
    }

    return res 
    .status(200)
    .json(new ApiResponse(200,updatedComment,"Comment Updated Successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404,"Invalid Comment ID")
    }

    const deletedComment = await Comment.findByIdAndDelete({
        _id : commentId,
        owner : req.user?._id
    })

    if (!deletedComment) {
        throw new ApiError(500, "Something went wrong while deleting the comment");
      }

      return res
      .status(200)
      .json(
        new ApiResponse(200, deletedComment, "Comment deleted successfully")
      );
})


export {
    getVideoComments
    ,addComment
    ,updateComment
    ,deleteComment
}