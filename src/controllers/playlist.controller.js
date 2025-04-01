import mongoose,{isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from '../models/video.model.js'

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    if(!name || !description){
        throw new ApiError(404,"Name or Description not given")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner : req.user?._id
    })

    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating the playlist");
      }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist created Successfully"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!isValidObjectId(userId)){
        throw new ApiError(401,"Invalid UserID")
    }

    const userPlaylist = await Playlist.find({owner:userId})

        if(!userPlaylist){
            throw new ApiError(404,"Unbable to Fetch User Playlist")
        }

    return res
    .status(200)
    .json( new ApiResponse(200,userPlaylist,"User Playlist Fetch Successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(404, " Invalid Playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(401,"Unbable to fetch Playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(201,playlist,"Playlist fetch successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404,"Playlist does not exists")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404,"Video does not exists")
    }

    const isVideoExists = playlist.videos.some(v => v._id.toString() === videoId)

    if (isVideoExists) {
        throw new ApiError(400, "Video is already in the playlist");
    }

    await playlist.videos.push(video)
    await playlist.save()

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Video added to Playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404,"Playlist does not exists")
    }

    const videoObjectId = new mongoose.Types.ObjectId(videoId);

    const isVideoExists = playlist.videos.some(v => v.equals(videoObjectId))

    if (!isVideoExists) {
        throw new ApiError(400, "Video is not in Playlist");
    }
  
    playlist.videos = playlist.videos.filter(v => !v.equals(videoObjectId));
    
     
    await playlist.save()

    return res
    .status(200)
    .json(new ApiResponse(201,playlist,"video removed successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404,"Invalid PlaylistID")
    }

    const deletedPlaylists = await Playlist.findByIdAndDelete(playlistId)
    if (!deletedPlaylists) {
        throw new ApiError(404, "Playlist not found");
      }

      return res 
      .status(200)
      .json(new ApiResponse(200,deletedPlaylists,"Playlist Deleted Successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404,"Invalid PlaylistID")
    }

    if(!name || !description){
        throw new ApiError(404,"Name or Description not given")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,{
        $set:{
            name,
            description
        }
    },{new : true})

    if(!updatedPlaylist){
        throw new ApiError(404,"Unable to fetch Playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updatedPlaylist,"Playlist deatils updated successfully"))
})

export {
    createPlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    addVideoToPlaylist
}