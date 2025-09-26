import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import  asyncHandler  from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  //existingLike is a Mongoose document representing the like record in your Like collection for that specific user and video.
  const existingLike = await Like.findOne({ video: videoId, likedBy: userId });//ye us like document ko search karega jiski video field me ye videoId hogi aur likedBy field me ye userId hogi.

  if (existingLike) { //if existingLike document exist it means the video is liked by the user
    //To unlike delete the existingLike document
    await existingLike.deleteOne(); //deleteOne() deletes the entire Like document, not just a field.
    return res.status(200).json(new ApiResponce(200, "Video Unliked"));
  } else {
    //Like  ,//Creates a new Like document linking the user and video.
    const likeddoc = await Like.create({ video: videoId, likedBy: userId });
    return res.status(200).json(new ApiResponce(200, likeddoc, "Video Liked"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on comment
  const { commentId } = req.params;
  const userId = req.user._id;
  

  if (!mongoose.isValidObjectId(commentId)) { //will check that commentId is valid or not
    throw new ApiError(400,"Invalid comment ID")
  }
    //Like collections ke andar thousands of document hai, ye srif us ek like document ko search karega jiski comment field me ye commentId hai aur likedBy field me ye usarId hai.
  const existingLike = Like.findOne({ comment: commentId, likedBy: userId })
  
  if (existingLike) {
    //if this document exist means the user has liked the video,for toggling/unliking it delete this document
    await existingLike.deleteOne();
    return res.status(200).json(new ApiResponce(200, "Comment Unliked"));
  } else {
    const commentLiked = await Like.create({ comment: commentId, likedBy: userId })
    return res.status(200).json(new ApiResponce(200, commentLiked, "Comment Liked"));
  }

});

const toggleTweetLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on tweet
  const { tweetId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId })
  

  if (existingLike) {
    await existingLike.deleteOne();
    return res.status(200).json(new ApiResponce(400,"Tweet Unliked"))
  } else {
    const tweetLiked = await Like.create({ tweet: tweetId, likedBy: userId });
    return res.status(200).json(new ApiResponce(400,tweetLiked ,"Tweet liked"))
  }


});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  //***************This code finds all liked document by a specific userId and populates only videoId****************************** */
  //find likes of this user and populates videos
  //give me that all like documents from likes collection whose likedBy fields userId matches this userId
  /* const likedVideos = await Like.find({ likedBy: userId }).populate({
    path: "video", //populate it with all fields
    populate: {  //populating inside the video,& video has owner
      path: "owner", //populate it with selective fields, "owner is also the user"
      salect: "username fullName avatar", // only these fields from User
    },
  })
  .sort({ createdAt: -1 }) //most recent likes first*/

  // const videosOnly = likedVideos.map((like) => like.video);

  /*return res
    .status(200)
    .json(new ApiResponce(200, videosOnly, "Liked video fetched successfully"));*/

  //This will find all the liked videos document //*******Explanation below************** */
  const likedVideoIds = await Like.find({ likedBy: userId }).distinct("video");

  const videosOnly = await Video.find({ _id: { $in: likedVideoIds } })
    .populate("owner", "username fullName avatar")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponce(200, videosOnly, "Liked videos fetched successfully")
    );

  
  //Explanation
  /**1. .distinct("video")
When you write:
const likedVideoIds = await Like.find({ likedBy: userId }).distinct("video");

Like.find({ likedBy: userId }) → finds all documents in the Like collection where likedBy = this user.
.distinct("video") → instead of returning the full documents, it extracts unique values from the video field.
So you get an array of unique video IDs that the user has liked.

👉 Example:

Likes collection:
[
  { likedBy: 123, video: "a1" },
  { likedBy: 123, video: "a2" },
  { likedBy: 123, video: "a1" } // duplicate
]

likedVideoIds = ["a1", "a2"] // distinct removes duplicates

2. _id: { $in: likedVideoIds }
Now you query the Video collection:
const videosOnly = await Video.find({ _id: { $in: likedVideoIds } });


_id → MongoDB’s primary key for each video.
{ $in: likedVideoIds } → means “give me all videos whose _id is inside this array”.

👉 Example:

likedVideoIds = ["a1", "a2"]
Video.find({ _id: { $in: ["a1", "a2"] } })

This will return all video documents with IDs a1 and a2.

✅ In short:
.distinct("video") → get unique video IDs the user liked.
_id: { $in: likedVideoIds } → fetch full video documents whose IDs match those. */
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };


/**🔹 What this does
Checks if the logged-in user’s ID is valid.

Gets all Like documents where likedBy = req.user._id.

Populates the video field (and also the owner of that video).

Returns the list of liked videos. */
  
  


  

  

  
  

  


/**1. The line:
const { videoId } = req.params;

Here, req.params is an object that contains all the route parameters from the URL. For example, if your route is:

app.post("/videos/:videoId/like", toggleVideoLike);


and the request URL is:

POST /videos/12345/like


then:

req.params = { videoId: "12345" }

2. Destructuring

The curly braces { videoId } is object destructuring:

const videoId = req.params.videoId;


is equivalent to:

const { videoId } = req.params;

It’s just a shorter and cleaner way to extract a property from an object.

✅ Summary
Not importing — the curly braces here are destructuring syntax.
It’s a shorthand for getting videoId (or commentId, tweetId) directly from req.params.
Saves you from writing req.params.videoId multiple times. */



  ///////////////////////////////////////////////////////////////////////////////////////////////////

/**Check if the user already liked the video

const existingLike = await Like.findOne({ video: videoId, likedBy: userId });


videoId → the video being liked

likedBy → the user performing the action

If like exists → unlike

if (existingLike) {
  await existingLike.deleteOne(); // deletes the document from Likes collection
  return res.json(new ApiResponse(200, "Video Unliked"));
}


deleteOne() deletes the entire Like document, not just a field.

If like does not exist → like

await Like.create({ video: videoId, likedBy: userId });
return res.json(new ApiResponse(200, "Video Liked"));

Creates a new Like document linking the user and video. */

























/**existingLike is a Mongoose document representing the like record in your Like collection for that specific user and video. Let me break it down:

Suppose your Like schema looks like this:
import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
  video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
  likedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export const Like = mongoose.model("Like", likeSchema);

What existingLike contains

When you do:
const existingLike = await Like.findOne({ video: videoId, likedBy: userId });


existingLike will be something like this (as a Mongoose document):

{
  _id: ObjectId("64f..."),       // unique ID of this Like document
  video: ObjectId("64a..."),     // the video that was liked
  likedBy: ObjectId("64b..."),   // the user who liked it
  createdAt: ISODate("2025-09-25T04:00:00.000Z"), // when the like was created
  updatedAt: ISODate("2025-09-25T04:00:00.000Z"), // when it was last updated
  __v: 0                         // internal Mongoose version key
}


It’s full document object, not just a boolean.

You can access any field:

console.log(existingLike.video);    // ObjectId of the video
console.log(existingLike.likedBy);  // ObjectId of the user
console.log(existingLike._id);      // document ID

Why it works in your code
If existingLike exists → it evaluates to true → you remove it (unlike)
If existingLike is null → it evaluates to false → you create a new like */



/**const userId = req.user._id;
is extracting the logged-in user’s ID from the request object. Let me break it down:

1. req.user
Usually, req.user is added by authentication middleware (e.g., JWT verification).
After the user logs in and sends a token, a middleware verifies it and sets req.user with the user’s data from the database.
Example middleware:

js
Copy code
const verifyJWT = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).send("Unauthorized");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded; // attaching user info to req
  next();
};
2. _id
MongoDB uses _id as the unique identifier for every document.
req.user._id gives you the user’s unique ID so you can, for example:
Track who liked a video
Check ownership of a comment
Fetch only the logged-in user’s data

3. Why assign to userId
js
Copy code
const userId = req.user._id;
It’s just easier to reference userId instead of writing req.user._id everywhere.
Makes the code cleaner and more readable.

 */