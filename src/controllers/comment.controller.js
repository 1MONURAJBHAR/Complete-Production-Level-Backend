import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET all comments for a video with pagination
const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {   //check wheather the videoId is valid mongoose object id or  not
    throw new ApiError(400,"Invalid video ID")
  }

  const aggregateQuery = Comment.aggregate([
    //Runs a MongoDB aggregation pipeline on the Comment collection.
    {
      $match: {
        //this will find inside the "comments collection"to that comment document whose (video: videoId) matches to this videoId.
        //  And will return to that single comment document for next stage, for the next stage this single comment document will be treated as original document.
        video: videoId,  //hame bahut saare comment documents milenge comment collection ke andar jinki video field ki id same hogi videoId se, but owner id har ek document ki different hogi because,
                         // same video per bahut log comment kar sakte hai
      },
    },
    {
      $lookup: {
        from: "users", //Go inside the mongodb users collection, in users collection there are alot of user documents made based on userSchema
        localField: "owner", //This owner is that user who has commented on the video, he is the owner of the content.
        foreignField: "_id", //This is the id of each user document inside users collection in mongodb
        as: "owner", //when the comment documents--> owner id is matched with the users document --> _id, means  the user that has commented on that video is found.Attach that users document in this field named as owner.
        //owner:[{users document}] attach this inside the comments document inside owner field
        pipeline: [
          //Now from that users document only pick these three fields which are needed to us and add inside owner. then owner:[{fullName,username,avatar}]
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const paginatedComments = await Comment.aggregatePaginate(aggregateQuery, options)
  
  return res
    .status(200)
    .json(new ApiResponse(200, paginatedComments, "Comments fetched successfully"))
  
});

// ADD a comment to a video
const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400,"Comment content is required")
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const comment = await Comment.create({  //As defined in user schema
    content,
    video: videoId,
    owner: req.user._id
  });
    
  return res
    .status(201)
    .json(new ApiResponse(201, comment, "comment added successfully"));
  
    
});

//UPDATE a comment
const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Comment content is required")
  }
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID")
  }

  const comment = await Comment.findOneAndUpdate(
    { _id: commentId, owner: req.user?._id },  //only user can update
    { content },
    { new: true }
  
  );

  if (!comment) {
    throw new ApiError(404, "Comment not found or you are not the owner");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"))
  

});


//DELETE a comment
const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }
  
  const comment = await Comment.findOneAndDelete({
    //delete only comment not the document
    _id: commentId,
    owner: req.user?._id, // only owner can delete or { _id: commentId, owner: req.user._id } → ensures the logged-in user is the owner of the comment before deleting.
  });

  if (!comment) {
    //The comment variable will contain the deleted document (or null if no match is found).
    throw new ApiError(404,"Comment not found or you are not the owner")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"))
  

});

export { getVideoComments, addComment, updateComment, deleteComment };



  
/**Filter: { _id: commentId, owner: req.user._id }
_id: commentId → Find the comment with the specific ID.
owner: req.user._id → Only match if the logged-in user (req.user._id) is the owner of the comment.
✅ This ensures only the owner can update their own comment. */
  
  
  
  /**
   * const comment = await Comment.findOneAndDelete({
     _id: commentId,
     owner: req.user._id // only owner can delete
   });

🔎 What happens here?
findOneAndDelete → finds one document that matches the filter and deletes the entire document from the collection.

{ _id: commentId, owner: req.user._id } → ensures the logged-in user is the owner of the comment before deleting.

✅ So:
It removes the whole comment document (not just the content field).
After this, the comment will no longer exist in the comments collection.
The comment variable will contain the deleted document (or null if no match is found). */
  
  
  
  
/**
 * 
 * const comment = await Comment.findOneAndUpdate(
    { _id: commentId, owner: req.user._id }, // filter
    { content },                             // update
    { new: true }                             // options
);


1️⃣ Comment.findOneAndUpdate(filter, update, options)
findOneAndUpdate is a Mongoose method used to find a single document and update it in one atomic operation.

2️⃣ Filter: { _id: commentId, owner: req.user._id }
_id: commentId → Find the comment with the specific ID.
owner: req.user._id → Only match if the logged-in user (req.user._id) is the owner of the comment.
✅ This ensures only the owner can update their own comment.

3️⃣ Update: { content }
This is shorthand for { content: content }.
It replaces the content field of the matched comment with the new value provided.

4️⃣ Options: { new: true }
By default, findOneAndUpdate returns the document before the update.
{ new: true } tells Mongoose to return the updated document instead.

5️⃣ await
Since this is an asynchronous operation, await pauses execution until the database returns a result.
comment will contain the updated comment document (or null if no match is found).

✅ Summary
This line of code:
Searches for a comment by its ID and ensures the requester is the owner.
Updates the content field of the comment.
Returns the updated comment.
If the comment doesn’t exist or the user isn’t the owner, comment will be null. */
  
  
  
  
  
  /**ChatGPT said:

.aggregatePaginate is not a built-in Mongoose method — it comes from the plugin
👉 mongoose-aggregate-paginate-v2

🔹 What It Does
Lets you run an aggregation pipeline (like $match, $lookup, $unwind, etc.)
Automatically adds pagination (page, limit, totalDocs, totalPages, etc.)
Returns results along with useful metadata (instead of you manually writing $skip + $limit + $count).
🔹 How to Use

Install plugin

npm install mongoose-aggregate-paginate-v2


Attach plugin to your schema

import mongoose from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new mongoose.Schema(
  {
    text: String,
    videoId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId
  },
  { timestamps: true }
);

commentSchema.plugin(aggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);


Use in controller

const options = {
  page: parseInt(req.query.page) || 1,
  limit: parseInt(req.query.limit) || 10
};

const aggregateQuery = Comment.aggregate([
  { $match: { videoId: new mongoose.Types.ObjectId(req.params.videoId) } },
  { $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user"
  }},
  { $unwind: "$user" }
]);

const paginatedComments = await Comment.aggregatePaginate(aggregateQuery, options);

res.json(paginatedComments);

🔹 Example Output
{
  "docs": [
    {
      "_id": "650abc...",
      "text": "Great video!",
      "user": { "_id": "64fxyz...", "name": "Monu" }
    }
  ],
  "totalDocs": 25,
  "limit": 10,
  "page": 1,
  "totalPages": 3,
  "hasNextPage": true,
  "hasPrevPage": false
}


👉 So .aggregatePaginate is basically just pagination support for aggregation pipelines in Mongoose. */





////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  
  
  
  
  
  
  

/**{ $unwind: "$owner" },
is part of a MongoDB aggregation pipeline. Let me explain 👇

🔹 What $unwind Does
$unwind is used to deconstruct an array field in documents.
For each element in the array, $unwind creates a separate document.
If the field (owner here) is not an array, MongoDB still treats it like an array of one element (so it doesn’t break).

🔹 Example
Suppose your document looks like this:

json
Copy code
{
  "_id": 1,
  "title": "Video A",
  "owner": [
    { "name": "Monu", "id": 101 },
    { "name": "Raj", "id": 102 }
  ]
}
After:

js
Copy code
{ $unwind: "$owner" }
The output becomes:

json
Copy code
{
  "_id": 1,
  "title": "Video A",
  "owner": { "name": "Monu", "id": 101 }
}
{
  "_id": 1,
  "title": "Video A",
  "owner": { "name": "Raj", "id": 102 }
}
So now, instead of one document with an array of owners, you get multiple documents — one per owner.

🔹 Why It’s Useful
Makes it easier to do joins ($lookup) or grouping on array items.
Common in schemas like:
Users with multiple roles
Posts with multiple tags
Videos with multiple owners */