import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Video} from "../models/video.model.js"
import mongoose,{isValidObjectId} from "mongoose"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query="", sortBy="createdAt", sortType="desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
    if (!req.user) {
        throw new ApiError(401,"User need to login first")
    }
    const match = {
        ...(query ? {title : {$regex : query , $options :"i"}} : {}),
        ...(userId ? {owner : mongoose.Types.ObjectId(userId)} : {})
    }
    const videos = await Video.aggregate([
    {
        $match : match
    },
    {
        $lookup : {
            from : "users",
            localField : "owner",
            foreignField : "_id",
            as : "owner"
        }
    },
    {
        $project : {
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          isPublished: 1,
          owner : {
            username : { $arrayElemAt: ["$owner.username",0]},
            fullName : { $arrayElemAt: ["$owner.fullName",0]}
          }
        }
    },
    {
        $sort : {
            [sortBy] : sortType === "desc" ? -1 : 1
        }
    },
    {
        $skip : (page-1) * parseInt(limit)
    },
    {
        $limit : parseInt(limit)
    }
    ])

    if (!videos.length) {
        throw new ApiError(404, "Could not able to fetch videos")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,videos,"Vidoes fetch Succesfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description,} = req.body;
    // TODO: get video, upload to cloudinary, create video
    if(!title){
        throw new ApiError(401,"Title is required")
    }
    if(!description){
        throw new ApiError(401,"Description is required")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path

    if(!videoFileLocalPath){
        throw new ApiError(404, "Video file is not uploaded properly")
    }
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!thumbnailLocalPath){
        throw new ApiError(404, "Thumbnail file is not uploaded properly")
    }

    const video = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
 
    if(!video){
        throw new ApiError(404,"There is an issue while uploading video on cloudinary")
    }
    if(!thumbnail){
        throw new ApiError(404,"There is an issue while uploading thumbnail on cloudinary")
    }

    const videoDoc = await Video.create({
        videoFile : video.url,
        thumbnail : thumbnail.url,
        title,
        description,
        owner : req.user?._id,
        duration : video.duration
    })

    if(!videoDoc){
        throw new ApiError(401,"Something went wrong while publishing a video")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,videoDoc,"Video Uploaded Succesfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(401,"Invalid Video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(401,"Invalid Video ID")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video fetch Successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params
    const {title,description} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"Invalid VideoID")
    }
    
    if(!(title && description)){
        throw new ApiError(404,"Title and description are required")
    }
     
    const newThumbnailPath = req.file?.path

    if(!newThumbnailPath){
        throw new ApiError(404,"unable to retrive thumbnail")
    }

    const newThumbnail = await uploadOnCloudinary(newThumbnailPath)

    if (!newThumbnail) {
        throw new ApiError(401,"there is an error while uplaoding thumbnail on cloudinary")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId,{
        title,
        description,
        thumbnail : newThumbnail.url
    },{
        new:true
    })


    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
      }


    return res
    .status(200)
    .json(new ApiResponse (200,updateVideo,"Video Deatils updated successfully"))
    
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401,"Invalid Video ID")
    }

    const video = await Video.findByIdAndDelete(videoId)

    if (!video) {
        throw new ApiError(401,"Unable to delete video")
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200,video,"video deleted succesfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404,"Invalid Video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");
      }

      video.isPublished = !video.isPublished;
      await video.save();

      return res 
      .status(200)
      .json(new ApiResponse(200,video,"Video status Toggled successfully"))
    
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}