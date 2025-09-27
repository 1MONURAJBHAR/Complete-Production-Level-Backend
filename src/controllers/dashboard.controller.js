import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import  asyncHandler  from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const channelId = req.user._id; //channel = logged-in user, This channelId is taking from users.

  //count videos uploaded                        //count all that videos whose owner id is matched with channelId
  const totalVideos = await Video.countDocuments({ owner: channelId }); //"owner" from Video collection, channelId from "User" collection

  //This query calculates the total views of all videos owned by one channel.
  const videoStats = await Video.aggregate([
    {
      //first stage,Filters the Video collection
      $match: { owner: channelId }, //collect all those video documents whose owner is matched with my channelId,(i.e., all videos of one channel).
    },
    {
      //data --> all video documents whose owner id is same as channelId,(i.e., all videos of one channel).
      $group: {
        //Groups the filtered documents together (_id: null means all in one group).
        _id: null,
        totalViews: { $sum: "$views" }, //totalViews: { $sum: "$views" } → adds up the views field from all those videos.
      },
    },
  ]);
  //Output:
  /**videoStats:[ //Extracting totalViews from videoStats array videoStats[0]?.totalViews 
           {
              _id: null,
               totalViews: 12345 // total of all views across channel's videos
            }
         ] */
  const totalViews = videoStats[0]?.totalViews || 0;

  //count subscribers
  const totalSubscribers = await Subscription.countDocuments({ channel: channelId })
  
  //count likes on all videos uploaded by one channel
  const totalLikes = await Like.countDocuments({//For detailed info/explanation see below
    video: { $in: await Video.find({ owner: channelId }).distinct("_id") },
  })

  return res
    .status(200)
    .json(new ApiResponce(200, { totalVideos, totalViews, totalSubscribers, totalLikes }, "Channel statistics fetched successfully"))
  
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const channelId = req.params.channelId || req.user._id; //channel = logged-in user, This channelId is taking from users.

  const videos = await Video.find({ owner: channelId }) //Iss "channelId" se matching saare "owner" field vale video document collect karo from videos collection in DB ,i.e: match each owner field of all video document inside the Video collection with the provided channelId and collect all video document & apply next line of code on these video documents
    .populate("owner", "username avatar") //Replace the IDs with their actual documents,"owner" ID ko populate karo username & avatar se, owner is also a user so we can populate it with username and avatar
    .sort({ createdAt: -1 }); //sort the videos in decending order of their createdAt(i.e: the first created video will be at bottom and the last created video will be at the top)
  //So that we get the latest video on the top

  return res
    .status(200)
    .json(new ApiResponce(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };


  
  
  
/**1. .countDocuments({ filter })

This is a Mongoose method, not an aggregation pipeline.
Example:

const totalVideos = await Video.countDocuments({ owner: channelId });


Here, { owner: channelId } is just a query filter, same as find().

It’s telling MongoDB: “Count how many documents in the videos collection have the field owner equal to this channelId.”
It does not use $match or pipeline stages, just a filter object.
Under the hood, MongoDB runs something like:
db.videos.countDocuments({ owner: ObjectId("...") }) */



  
  
  
  

  

  
  /**In MongoDB, when you create relationships, you usually store only the ID of the related document (not the whole document).

Example:

const commentSchema = new Schema({
  content: String,
  video: { type: Schema.Types.ObjectId, ref: "Video" }, // reference
  owner: { type: Schema.Types.ObjectId, ref: "User" }   // reference
});


Here:

video → stores the _id of a Video document.
owner → stores the _id of a User document.
By default, if you query a comment, you’ll get only IDs:

{
  content: "Nice video!",
  video: "65123abc...",
  owner: "76123xyz..."
}

🔎 What populate() does:

It replaces those IDs with the actual documents from the other collections.

Example:

const comment = await Comment.findOne().populate("owner").populate("video");


Now the result becomes:

{
  content: "Nice video!",
  video: {
    _id: "65123abc...",
    title: "My First Video",
    views: 200
  },
  owner: {
    _id: "76123xyz...",
    username: "JohnDoe",
    email: "john@example.com"
  }
}

✅ Simple meaning:
populate() = join-like feature in MongoDB via Mongoose.
It fetches the related documents for you, instead of just showing their IDs. */

  

  


  

  

  
  
  
  
  
/**Step by step:
Video.find({ owner: channelId })
Finds all videos where owner matches channelId.

.distinct("_id")

From those videos, extract only the unique _id values.
Result: an array of video IDs belonging to that channel.

Example:

[ ObjectId("a1"), ObjectId("a2"), ObjectId("a3") ]


video: { $in: [...] }

//Ye video ki field(liked odcument me se) inn IDs(list of IDs which are on my channel) ki list me honi chahiye,agar hai toh us document ko collect kar lo. 
/***************************or************************ */
/*Means: “video field must be one of these IDs.”, The matched video fields document is collected and then counted.
So this will match documents (like comments, likes, etc.) where video refers to any of that channel’s videos.

✅ Example use case:
Suppose you’re querying Comment collection:

const comments = await Comment.find({
  video: { $in: await Video.find({ owner: channelId }).distinct("_id") }
});

This finds all comments across all videos of a given channel. 

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 

//****************************************************In simple words********************************************* */
/*video: { $in: await Video.find({ owner: channelId }).distinct("_id") }
Imagine:
Video collection → has many videos. Each video has an _id and an owner.

Comment collection → each comment belongs to a video (via video field).

Step by step:
Video.find({ owner: channelId }) → Find all videos of that channel.
👉 Example result:


Copy code
[ { _id: 101 }, { _id: 102 }, { _id: 103 } ]
.distinct("_id") → Pick only the video IDs.
👉 Result:

Copy code
[101, 102, 103]
video: { $in: [...] } → Find all documents where the video field is in that list of IDs.

✅ Simple meaning:
This code makes sure you are only selecting documents (like comments, likes, etc.) that belong to the videos of one channel.*/
