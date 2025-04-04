import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscriber.controller.js";

const router = Router()

router.use(verifyJWT)

router
    .route("/c/:channelId")
    .post(toggleSubscription);
router.route("/c/").get(getSubscribedChannels)
router.route("/u/").get(getUserChannelSubscribers);

export default router 