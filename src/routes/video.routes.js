import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;












//req.query vs req.params
/**Why it might be returning “all video IDs”
You are sending videoId in query instead of params
req.params only reads route parameters, e.g., /video/:videoId.
If you call your endpoint like:

GET /api/v1/videos?videoId=68d659a72aa9a3b146e6c529
then req.params.videoId is undefined, because videoId is in query, not params.
mongoose.isValidObjectId(undefined) returns false, so maybe you are bypassing that check in your actual code?

✅ Fix: either use route param or read from query:
// Route param version
const { videoId } = req.params; // /videos/:videoId

// OR Query version
const { videoId } = req.query;  // /videos?videoId=...


Route setup
Make sure your route is defined correctly:
router.get("/videos/:videoId", getVideoById); // Route param
// or
router.get("/videos", getVideoById);          // Query param


If your route is just /videos, and you try to use req.params.videoId, it will always be undefined → findById(undefined) → may return all videos if your code somehow ignores it (depending on how you wrote Video.findById() or used aggregation).

Correct URL call
Route param version:
GET /api/v1/videos/68d659a72aa9a3b146e6c529

Query param version:
GET /api/v1/videos?videoId=68d659a72aa9a3b146e6c529
And adjust your code accordingly (req.params vs req.query). */




/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**2️⃣ Mixing : and ?
? starts query parameters, e.g., ?videoId=....
You cannot write /:?videoId=... — that is invalid.

✅ Correct ways to call your endpoint
Option 1: Route param
If your Express route is:

router.get("/video/:videoId", getVideo);


Then your URL should be:

{{server}}/video/68d659a72aa9a3b146e6c529

Option 2: Query param
If your Express route is:

router.get("/video", getVideo);


Then your URL should be:

{{server}}/video?videoId=68d659a72aa9a3b146e6c529


✅ Summary:
Remove the colon : in the actual request URL.
Use either route param (/video/:videoId) or query param (/video?videoId=...). */



/**.post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);
1️⃣ .post(...)
This is an Express router method.
It means: when a POST request comes to this route, run the provided middlewares/controllers.

2️⃣ upload.fields([...])
This comes from Multer, a middleware for handling file uploads in Express.

upload.fields() lets you handle multiple file inputs with different field names.

Here you define:

js
Copy code
[
  { name: "videoFile", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]
👉 This means the client (frontend) must send a multipart/form-data request with:
one file under the field name "videoFile"
one file under the field name "thumbnail"
If more than maxCount files are sent for a field, Multer will throw an error.

3️⃣ What happens after Multer parses the request
Multer will add uploaded files into req.files object:

js
Copy code
req.files = {
  videoFile: [
    {
      fieldname: "videoFile",
      originalname: "myvideo.mp4",
      encoding: "7bit",
      mimetype: "video/mp4",
      destination: "uploads/",
      filename: "1234567890.mp4",
      path: "uploads/1234567890.mp4",
      size: 1048576
    }
  ],
  thumbnail: [
    {
      fieldname: "thumbnail",
      originalname: "mythumb.png",
      encoding: "7bit",
      mimetype: "image/png",
      destination: "uploads/",
      filename: "9876543210.png",
      path: "uploads/9876543210.png",
      size: 20480
    }
  ]
}
4️⃣ publishAVideo
This is your controller function.
It runs after Multer has uploaded the files.

Inside publishAVideo, you can access:

js
Copy code
const videoFile = req.files.videoFile[0].path;   // uploaded video path
const thumbnail = req.files.thumbnail[0].path;   // uploaded thumbnail path
const { title, description } = req.body;         // text fields sent in form
Then you can:

Upload them to Cloudinary (uploadOnCloudinary(videoFile))

Save metadata to MongoDB

Send back a response

🔹 Example Flow
Client sends POST request with form-data:

title=My first video

description=Cool video

videoFile=myvideo.mp4

thumbnail=mythumb.png

Multer stores the files and attaches info to req.files.
publishAVideo runs, reads files from req.files, uploads to Cloudinary, saves DB record.
API responds: "Video published successfully!".
👉 In short:
This code means: when a POST request comes, first handle file uploads (video + thumbnail), then run publishAVideo to process and save them. */