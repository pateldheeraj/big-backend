import {isValidObjectId} from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscriberId = req.user?._id

    if(!isValidObjectId(channelId)){
        throw new ApiError(404,"Invalid ChannelID")
    }

    if(channelId.toString() === subscriberId.toString()){
        throw new ApiError(400,"You cannot subscribe your channel")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel : channelId 
    })

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res 
        .status(200)
        .json(new ApiResponse(201,{},"Unsubscribed Successfully"))
    }

    await Subscription.create({
        subscriber:subscriberId,
        channel:channelId
    })

    return res
    .status(201)
    .json(new ApiResponse(201, {}, "Subscribed successfully"));
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const channelId = req.user?._id

    if (!isValidObjectId(channelId)) {
        throw new ApiError(404,"Invalid ChannelID")
    }

    const subscriberDocs = await Subscription.find({channel : channelId}).populate("subscriber","_id fullName email")

    if(!subscriberDocs){
        throw new ApiError(404,"Unable to find Subscribers")
    }

    return res 
    .status(200)
    .json(new ApiResponse(201,subscriberDocs,"user subscriber fetch successful"))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.user?._id

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(404,"Invalid SUbscriberId")
    }

    const subscriberDocs = await Subscription.find({subscriber : subscriberId}).populate("channel","_id fullName email")

    if(!subscriberDocs){
        throw new ApiError(404,"Channel list not found")
    }

    return res 
    .status(200)
    .json(new ApiResponse(201,subscriberDocs,"Subscribed Channel fetch successfully"))
})

export{
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}