import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponce } from "../utils/ApiResponce.js";
import  asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  const { channelId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(channelId) && !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid channel or user ID")
  }

  if (channelId.toString() === userId.toString()) {
    throw new ApiError(400, "You cannot subscribe to yourself")
  }

  //Check if subscription exists
  const existing = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existing) {
    //unsubscribe
    await existing.deleteOne();
    return res
      .status(200)
      .json(new ApiResponce(200, null, "Unsubscribed Successfully"));
  } else {
    //subscribe
    const subscription = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    return res
      .status(201)
      .json(new ApiResponce(201, subscription, "Subscribed Successfully"));
  }

});

// controller to return subscriber list of a channel  or  // Get subscriber list, of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Inavlid channel ID");
  }
        //for finding subscribers of a channel count all matched channel, for finding subscribedTo count all matched subscriber
  const subscribers = await Subscription.find({ channel: channelId }).populate("subscriber", "username fullName avatar").sort({createdAt:-1})


  return res
    .status(200)
    .json(new ApiResponce(200, subscribers, "Subscribers fetched successfully"))
  

});

// Get channels that a user has subscribed to "or"
// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!mongoose.isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }

  const channels = await Subscription.find({ subscriber: subscriberId }).populate("channel", "fullName username avatar");


  
  if (!channels) {
    throw new ApiError(400, "Channel does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponce(200, channels, "channels fetched successfully"));
  

});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };

/**The key here is what find() returns in Mongoose:
Model.find(...) always returns an array.
If no documents match, it returns an empty array ([]), not null.
Only findOne() or findById() can return null when nothing is found.

Your code:
const channels = await Subscription.find({ subscriber: subscriberId }).populate("channel", "fullName username avatar");

if (!channels) {
  throw new ApiError(400, "Channel does not exist");
}


channels will be [] if you haven’t subscribed to any channel.
[] is truthy in JavaScript, so the if (!channels) check will not run.

✅ Fix
Check if the array is empty instead:

if (!channels || channels.length === 0) {
  throw new ApiError(400, "Channel does not exist");
}

Extra Tip
If you just want to return an empty list (instead of an error), you can safely do:

return res.status(200).json(
  new ApiResponse(200, channels, "Subscribed channels fetched successfully")
); */

