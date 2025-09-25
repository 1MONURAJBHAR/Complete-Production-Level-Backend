import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

// ✅ Every route here will first go through verifyJWT (auth check)
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// ✅ Routes
router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router




/**router.route("/:videoId").get(getVideoComments).post(addComment);
is just a shortcut syntax in Express to attach multiple HTTP methods (GET, POST, etc.) to the same route (/:videoId).

🔎 How it works
If the client makes a GET request to /comments/:videoId,
→ Express runs getVideoComments.

If the client makes a POST request to /comments/:videoId,
→ Express runs addComment.

✅ Example:
1. GET request

http
Copy code
GET /comments/65201c9f7d1f2c3a456789ab
Calls: getVideoComments(req, res)

Typically returns all comments for that video.

2. POST request

http
Copy code
POST /comments/65201c9f7d1f2c3a456789ab
Content-Type: application/json

{
  "text": "Nice video 👍"
}
Calls: addComment(req, res)

Creates a new comment for that video.

⚡ Which runs first?
👉 It depends on the HTTP method of the request.
If you send a GET → only getVideoComments runs.
If you send a POST → only addComment runs.
They are independent of each other.
So think of it like a gate:
GET gate → goes to getVideoComments
POST gate → goes to addComment */