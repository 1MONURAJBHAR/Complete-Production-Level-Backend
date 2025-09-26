import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query; //ex: GET /videos?page=2&limit=5&query=funny&sortBy=views&sortType=desc&userId=650a2b3c4d5e

  // get all videos based on query, sort, pagination
  const pipeline = [];

  //search filter
  if (query) {
    //query → search text (default empty).
    pipeline.push({
      $match: {
        //If someone types "funny", it finds videos whose title contains "funny" (case-insensitive).
        title: { $regex: query, $options: "i" }, //case insensitive
      },
    });
  }

  //user filter
  if (userId && isValidObjectId(userId)) {
    //If a userId is given, only fetch that user’s videos.
    pipeline.push({
      $match: { owner: userId },
    });
  }

  //lookup to get owner details(optional)
  pipeline.push({
    //This adds owner details (username & email) from the users collection into each video.
    $lookup: {
      from: "user",
      localfield: "owner",
      foreignfield: "_id",
      as: "owner",
      pipeline: [{ $project: { username: 1, email: 1 } }],
    },
  });

  pipeline.push({ $unwind: "$owner" }); //$unwind makes sure owner is an object, not an array.

  //sort
  pipeline.push({
    //: If sortBy=views&sortType=desc, results will be sorted by most viewed first.
    $sort: { [sortBy]: sortType === "asc" ? 1 : -1 },
  });

  const options = {
    page: parseInt(page),
    limit: parseIn(limit),
  };

  const videos = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
  );

  /**In MongoDB, aggregation means:
 Taking documents from a collection and processing them step by step to get a transformed result.
It’s like a data pipeline: each stage takes input, does some operation, and passes the output to the next stage.

Why use aggregation?
To filter data ($match)
To group data ($group)
To sort data ($sort)
To join collections ($lookup)
To calculate things like averages, sums, counts
Basically, aggregation is used for reporting, analytics, and transforming data. */

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

//upload a video
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  if (!req.files || !req.files.video || !req.files.thumbnail) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }

  //upload to cloudinary
  const videoFile = await uploadOnCloudinary(req.file.video[0].path);
  const thumbnailFile = await uploadOnCloudinary(req.files.thumbnail[0].path);

  if (!videoFile?.url) {
    throw new ApiError(500, "Video upload failed");
  }
  if (!thumbnailFile?.url) {
    throw new ApiError(500, "Thumbnail upload failed");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    owner: req.user._id, // logged-in user
    isPublished: true,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
  

});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId).populate("owner", "username email");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
  

});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;

  if (!title && !description && !req.file) {
    throw new ApiError(400, "Title and description are required ");
  }


  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  //Only owner can update
  if (video.owner.toString() !== req.user._id) {
    throw new ApiError(403, "You cannot update this video");
  }

  //update the video
  video.title = title;
  video.description = description;

  const thumbnailFile = await uploadOnCloudinary(req.file.path);

  if (thumbnailFile.url) {
    video.thumbnail = thumbnailFile.url;
  }

  await video.save()

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
  

});



const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
 
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  //Only owner can delete this video
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You cannot delete this video");
  }

  const videodeleted = await video.deleteOne();
  if (!videodeleted) {
    throw new ApiError(400,"Video is not deleted")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videodeleted,"Video deleted successfully"));

});

/**Validate videoId.
Flip the isPublished flag. */
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "You are not allowed to toggle the publish flag");
  }

  video.isPublished = !video.isPublished;

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"} successfully`))
  
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};

  





/**req.file how this will look
ChatGPT said:
Ah! Let’s visualize exactly what req.file looks like when you use multer with upload.single("thumbnail").
Suppose you have this in your route
router.post("/upload", upload.single("thumbnail"), publishAVideo);


And the user uploads a file called my-thumbnail.png.

1️⃣ req.file object

req.file will be an object like this:

{
  fieldname: 'thumbnail',          // the name of the input field
  originalname: 'my-thumbnail.png', // original file name from user's computer
  encoding: '7bit',                // file encoding
  mimetype: 'image/png',           // file type
  destination: 'uploads/',         // folder where multer saved the file
  filename: 'thumbnail-1695739200000.png', // renamed file (unique)
  path: 'uploads/thumbnail-1695739200000.png', // full path to file
  size: 102400                     // file size in bytes
}

2️⃣ Important fields for you
req.file.path → "uploads/thumbnail-1695739200000.png" → send this to Cloudinary for upload.
req.file.originalname → "my-thumbnail.png" → optional, just for reference.
req.file.mimetype → "image/png" → can validate file type.

3️⃣ Summary

req.file is a single object representing the uploaded file.
Use req.file.path to upload it to Cloudinary.
If you used upload.fields() (multiple fields), it becomes req.files with arrays instead of a single object.
If you want, I can also show the difference between req.file and req.files visually — it makes it super easy to remember. Do you want me to?

You said:
req.files how this will look
ChatGPT said:

Sure! Let’s visualize req.files when you upload multiple fields or multiple files using multer.

1️⃣ Setup with multer.fields()

Suppose your route looks like this:

router.post(
  "/upload",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),
  publishAVideo
);


video → video file

thumbnail → thumbnail image

2️⃣ Structure of req.files

req.files is an object, where keys are field names and values are arrays of file objects.

Example if a user uploads my-video.mp4 and my-thumbnail.png:

{
  video: [
    {
      fieldname: 'video',
      originalname: 'my-video.mp4',
      encoding: '7bit',
      mimetype: 'video/mp4',
      destination: 'uploads/',
      filename: 'video-1695739200000.mp4',
      path: 'uploads/video-1695739200000.mp4',
      size: 10485760
    }
  ],
  thumbnail: [
    {
      fieldname: 'thumbnail',
      originalname: 'my-thumbnail.png',
      encoding: '7bit',
      mimetype: 'image/png',
      destination: 'uploads/',
      filename: 'thumbnail-1695739200000.png',
      path: 'uploads/thumbnail-1695739200000.png',
      size: 102400
    }
  ]
}

3️⃣ How to access files
const videoFile = req.files.video[0];        // first video file
const thumbnailFile = req.files.thumbnail[0]; // first thumbnail file

// Example Cloudinary upload
await uploadOnCloudinary(videoFile.path);
await uploadOnCloudinary(thumbnailFile.path);

4️⃣ Key Differences from req.file
Feature	req.file	req.files
Type	Object	Object with arrays
Single file upload	upload.single("thumbnail")	N/A
Multiple fields/files	N/A	upload.fields([{...}])
Access file path	req.file.path	req.files.thumbnail[0].path */

























  

/** const options = {
  page: parseInt(page),
  limit: parseInt(limit),
};
is preparing pagination options for mongoose-aggregate-paginate-v2.

1️⃣ page
page tells MongoDB which page of results you want.
Example: ?page=2 → skip the first page, show the second page.
parseInt(page) converts the query parameter (a string) to a number.

"2" → 2

2️⃣ limit
limit tells MongoDB how many documents to return per page.

Example: ?limit=5 → return 5 videos per page.

parseInt(limit) converts string → number.

3️⃣ Why it’s needed
aggregatePaginate expects numbers for page and limit.
If you pass strings like "10" instead of 10, it may behave incorrectly.

4️⃣ Example
Suppose you have 12 videos:
page = 1, limit = 5 → returns videos 1–5
page = 2, limit = 5 → returns videos 6–10
page = 3, limit = 5 → returns videos 11–12
aggregatePaginate also gives metadata like totalDocs, totalPages, hasNextPage, etc.

*/
  
  ////////////////////////////////////////////////////////

/**Flow of Execution 🔄

User hits API → /videos?page=2&limit=5&query=cat&sortBy=views&sortType=desc
Builds pipeline step by step:
$match by title → only videos containing "cat".
$match by userId if provided.
$lookup to join with users collection (fetch uploader info).
$unwind so owner is an object, not an array.
$sort by views in descending order.
Pass pipeline into aggregatePaginate:

Runs aggregation.
Automatically applies skip + limit.
Returns paginated metadata.

4. Example Response 📦
{
  "status": 200,
  "data": {
    "docs": [
      {
        "_id": "65123...",
        "title": "Funny Cat Video",
        "owner": { "username": "John", "email": "john@email.com" },
        "views": 1200,
        "createdAt": "2025-09-25T10:00:00Z"
      }
    ],
    "totalDocs": 25,
    "limit": 5,
    "page": 2,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": true
  },
  "message": "Videos fetched successfully"
}


✅ In short:
This code builds a dynamic aggregation pipeline → applies search, filters, joins, sorting → then paginates with mongoose-aggregate-paginate-v2.
It’s like how YouTube shows you 10 results per page with filtering and sorting. */

  
  
  
  
  


/********************************************************************************************************************************************** */
  /**What is MongoDB Aggregation?
In MongoDB, aggregation means:
👉 Taking documents from a collection and processing them step by step to get a transformed result.
It’s like a data pipeline: each stage takes input, does some operation, and passes the output to the next stage.

Why use aggregation?
To filter data ($match)
To group data ($group)
To sort data ($sort)
To join collections ($lookup)
To calculate things like averages, sums, counts
Basically, aggregation is used for reporting, analytics, and transforming data.

Example

Suppose you have a videos collection:

[
  { "title": "A", "views": 100, "category": "Tech" },
  { "title": "B", "views": 50, "category": "Tech" },
  { "title": "C", "views": 200, "category": "Music" }
]

Simple Aggregation Pipeline:
db.videos.aggregate([
  { $match: { category: "Tech" } },       // 1. Filter only Tech
  { $group: { _id: null, total: { $sum: "$views" } } }  // 2. Sum all views
])


👉 Output:

[
  { "_id": null, "total": 150 }
]


So it told us: Tech videos have 150 views in total.
Difference from find()
find() → Just retrieves documents.
aggregate() → Lets you transform, join, and calculate with documents (like SQL queries with GROUP BY, JOIN, etc.).

⚡In short:
MongoDB aggregation = A pipeline of stages that process documents to produce transformed or summarized results.
Do you want me to explain all the common aggregation stages ($match, $group, $lookup, etc.) with simple examples?

You said:
the output current stage is the only input to next stage
ChatGPT said:

Exactly ✅ You got it right!
In MongoDB aggregation, each stage in the pipeline:
Takes the output from the previous stage

Processes it

Passes the result to the next stage
So it works like a chain / pipeline.

Example: Step by step

Suppose we have a collection students:

[
  { "name": "A", "age": 20, "marks": 80 },
  { "name": "B", "age": 22, "marks": 90 },
  { "name": "C", "age": 21, "marks": 70 }
]

Pipeline:
db.students.aggregate([
  { $match: { age: { $gte: 21 } } },     // Stage 1
  { $project: { name: 1, marks: 1 } },   // Stage 2
  { $sort: { marks: -1 } }               // Stage 3
])

How it flows:

Stage 1 ($match)
Input = all students
Output = students with age ≥ 21
→ [ { "name": "B", "age": 22, "marks": 90 }, { "name": "C", "age": 21, "marks": 70 } ]

Stage 2 ($project)
Input = stage 1 output
Keep only name and marks
→ [ { "name": "B", "marks": 90 }, { "name": "C", "marks": 70 } ]

Stage 3 ($sort)
Input = stage 2 output
Sort by marks descending
→ [ { "name": "B", "marks": 90 }, { "name": "C", "marks": 70 } ] */

  
  










  
  




















  
  /****const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);
is using Mongoose + mongoose-aggregate-paginate-v2 plugin.
Let’s break it step by step:

Video.aggregate(pipeline)

Runs a MongoDB aggregation on the Video collection.

pipeline is an array of aggregation stages (like $match, $lookup, $group, $sort, etc.).

Instead of returning normal .find(), this returns an aggregation cursor/query.

Example:

js
Copy code
const pipeline = [
  { $match: { isPublished: true } },
  { $sort: { createdAt: -1 } }
];
aggregatePaginate()

This function comes from mongoose-aggregate-paginate-v2.

It takes an aggregation object + pagination options and automatically applies limit, skip, page, and returns metadata.

options

Defines pagination settings like page number and limit. Example:

js
Copy code
const options = {
  page: 1,      // which page to return
  limit: 10,    // how many docs per page
};
Result (videos)

Instead of just giving raw documents, it gives a paginated response with docs + extra info:

Example result:

js
Copy code
{
  docs: [  // array of videos from this page 
  totalDocs: 50,
  limit: 10,
  page: 1,
  totalPages: 5,
  hasNextPage: true,
  hasPrevPage: false,
  nextPage: 2,
  prevPage: null,
  pagingCounter: 1
}
👉 In short:
This line is running an aggregation query with your pipeline and returning paginated results, so you don’t need to manually do skip/limit. */
////////////////////////////////////////////////////////////////////////////////////////////////////

/**if (query) {
  pipeline.push({
    $match: { title: { $regex: query, $options: "i" } }
  });
}
Meaning:
if (query) → only run this if the user gave some search text.

$match → MongoDB’s way to filter documents.

$regex: query → matches any title that contains the given text.

$options: "i" → makes it case-insensitive (so "funny", "Funny", "FUNNY" all match).

Example:
Suppose query = "cat".

It will match titles like:

"Cute Cat Video"
"cat playing piano"
"My CAT is funny"

👉 In short:
This code says:
“If the user typed something in search, filter videos so only titles containing that word show up.” */
/////////////////////////////////////////++++++++++++++++++++/////////////////////////////////////////////////////

/**This part is the user filter ✅

if (userId && isValidObjectId(userId)) {
  pipeline.push({
    $match: { owner: new mongoose.Types.ObjectId(userId) }
  });
}

Step by step:

if (userId && isValidObjectId(userId))
Check if userId was sent in the request query and if it’s a valid MongoDB ObjectId.
Example: userId=66f123abc... (a proper ObjectId).

pipeline.push({ $match: { owner: ... } })
Add a $match stage to the aggregation pipeline.

This tells MongoDB: “Only return videos where the owner field matches this user’s _id.”
new mongoose.Types.ObjectId(userId)

Converts the userId string into a MongoDB ObjectId type (required for matching).

Example:

Suppose your videos collection looks like this:

title	owner (userId)
"Funny Cat"	650a2...
"Travel Vlog"	650b3...
"Coding Tutorial"	650a2...

If request has ?userId=650a2...,
→ it will return only videos uploaded by that user:
"Funny Cat", "Coding Tutorial".

👉 In short:
This code makes the API return only the videos of a particular user, if a userId is provided in the request. */

/**pipeline.push({ $unwind: "$owner" });
Earlier, you used $lookup to join users collection with videos.
$lookup always returns an array (even if only one user matches).
$unwind converts that array into a single object. 



After $lookup:

{
  title: "Funny Cat",
  owner: [{ username: "John", email: "john@email.com" }]
}


After $unwind:

{
  title: "Funny Cat",
  owner: { username: "John", email: "john@email.com" }
}


So it’s easier to access.





//////////////////////////////////////////////////////////////////////////////////




pipeline.push({
  $sort: { [sortBy]: sortType === "asc" ? 1 : -1 },
});
This sorts the videos based on the user’s request.
sortBy → which field to sort on (like "views", "createdAt", etc.).
sortType → "asc" (1 = ascending) or "desc" (-1 = descending).

👉 Example:

If query is ?sortBy=views&sortType=desc,
videos will be sorted by highest views first.

3.
js
Copy code
const options = {
  page: parseInt(page),
  limit: parseInt(limit),
};
Tells the pagination plugin how many results per page and which page to show.

Example:

page=2&limit=5 → skip first 5 videos, return the next 5.

4.
js
Copy code
const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);
Runs the aggregation pipeline (all filters, lookup, sort).

Then applies pagination using the mongoose-aggregate-paginate-v2 plugin.

Returns a paginated result object that looks like this:

json
Copy code
{
  "docs": [ ...list of videos... ],
  "totalDocs": 25,
  "limit": 10,
  "page": 1,
  "totalPages": 3,
  "hasNextPage": true,
  "hasPrevPage": false
}
✅ In simple words:
This part takes all your filters (search, user, owner info), sorts the videos, and then splits the result into pages before sending them back.
It’s like how YouTube shows you 10 videos at a time, sorted by "Most Recent" or "Most Viewed", and you can go to page 2, 3, etc.



















*/