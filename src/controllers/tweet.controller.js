import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content is required");
  }

  const tweet = await Tweet.create({
    content: content,
    owner: req.user._id, //// assuming user is added to req.user by auth middleware
  });

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));

});


// ✅ Get all tweets of a particular user
const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;

  // 1. Validate userId
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // 2. Find all Tweet documents where "owner" = userId
  const tweets = await Tweet.find({ owner: userId })//Is userId ne alag alag tweets kiye honge, un sab tweet ke liye alag alag document banega tweet collection ke andar,un docs ko find karo ,aur owner filed populate karo
    .populate("owner", "username email") //// joins user details
    .sort({ createdAt: -1 }); // newest tweet first
  
  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});


/**isValidObjectId(userId) → prevents crashes if someone sends a random string instead of a valid MongoDB ID.
Tweet.find({ owner: userId }) → gets all tweets written by that user.
.populate("owner", "username email") → instead of just returning the owner’s _id, it pulls in selected fields (username, email) from the User model.
.sort({ createdAt: -1 }) → newest tweets appear first.
ApiResponse → ensures consistent response format. */

/**Example Response (assuming one tweet exists)
{
  "statusCode": 200,
  "data": [
    {
      "_id": "6510a1d3f8d5f6c3b1234567",
      "content": "Hello world 🌍",
      "owner": {
        "_id": "6510a0c9f8d5f6c3b1234566",
        "username": "john_doe",
        "email": "john@example.com"
      },
      "createdAt": "2025-09-25T14:15:22.123Z",
      "updatedAt": "2025-09-25T14:15:22.123Z"
    }
  ],
  "message": "User tweets fetched successfully"
} */



const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiResponse(400, "Invalid tweet ID");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content is required");
  }

  const tweet = await Tweet.findById(tweetId);
  
  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  //only owner can update tweet
  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this tweet");
  }

  tweet.content = content;
  await tweet.save();


  return res
    .status(200)
    .json(new ApiResponse(400, tweet, "Tweet updated successfully"));

});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user._id) {
    throw new ApiError(400, "You are not allowed to delete this tweet");
  }

  await tweet.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
