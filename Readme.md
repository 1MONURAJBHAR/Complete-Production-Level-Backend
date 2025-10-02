
# 📝 Product Requirements Document (PRD)

## 1. Project VideoTube Backend

**Product Name:** VideoTube Backend Project
**Version:** 1.0.0  
**Product Type:** Backend API for video-sharing platform


 A comprehensive backend service for a video-sharing platform (YouTube-like). Built with modern JavaScript technology and best practices for secure JWT authentication, file handling with cloud storage, and powerful MongoDB aggregation for analytics.

---

### 2. Target Users

**Content Creators:** These are the users who produce and upload content. The API includes numerous features specifically for them:
- Uploading videos and thumbnails.

- Managing their video content, including updating details, deleting videos, and toggling publish status.

- Viewing their channel's statistics, such as total video views, subscribers, total videos, and likes.

- Managing their channel profile, including their avatar and cover image.

- Interacting with their audience through tweets.

**Content Consumers (Viewers):** These are the users who watch videos and interact with creators and the community. The API caters to them with features like:

- Registering for an account and logging in.

- Querying for videos with pagination, sorting, and searching capabilities.

- Watching videos and having them added to their watch history.

- Interacting with content by liking videos, comments, and tweets.

- Leaving, updating, and deleting comments on videos.

- Subscribing to channels to follow their favorite creators.

- Organizing videos into personal playlists.


## 3. Core Features

- **User Authentication:** Secure registration & login using JWT (Access + Refresh tokens)
 - **User Profile Management:** Update user details, password, avatar and cover images
- **Channel Profiles:** View any user's channel profile with subscriber count and subscription status
- **Video Management:** Upload videos & thumbnails to Cloudinary, Update video metadata (title, description, thumbnail) Delete videos and toggle publish status
- **Advanced Video Discovery:** Pagination, search, sort, and filtering (by user, date, views, etc.)
- **Social Interactions:** Like/unlike videos, comments, and tweets Subscribe/unsubscribe to channels
- **Content InteractionL:** Comments: add / update / delete comments on videos Playlists: create / update / delete playlists, add or remove videos Tweets: create / update / delete short text posts
- **Dashboard & Analytics:** Channel statistics: total video views, subscribers, videos, likes
- **User History:** Track and view a logged-in user’s watch history
- **Health Check Endpoint:** Simple endpoint to verify API status

---

## 4. 🛠 Tech Stack & Libraries

* **Backend:** Node.js, Express.js
* **Database:** MongoDB with Mongoose ODM
* **Authentication:** JSON Web Tokens (`jsonwebtoken`), `bcrypt`
* **File Handling:** `multer` (multipart/form-data), Cloudinary for storage
* **DB Utilities:** `mongoose-aggregate-paginate-v2` (aggregation pagination)
* **API Utilities:** `asyncHandler`, custom `ApiError` and `ApiResponse` classes

---

### 5. Technical Specifications

####  API Endpoints Structure

**Users & Authentication** (`/api/v1/user/`)

- `POST /register`-Register a new user 
- `POST /login` - Login a user
- `POST /logout` - Logout a user(secured)
- `POST /refresh-token` -Get new access token from refresh token
- `POST /change-password` -change the password (secured)
- `GET /current-user` -Get the current user (secured)
- `PATCH /update-account`-Update the account(secured)
- `PATCH /avatar` -upload avatar(secured)
- `PATCH /cover-image` -upload coverimage(secured)
- `GET /c/:username` -Get channel profile
- `GET /watchHistory`- Get watch history(secured)

**Videos** (`/api/v1/video/`)

- `GET /`-List videos(secured) 
- `POST /`-Publish video (secured)
-  `GET /:videoId`-Get video details(secured)
- `PATCH /:videoId`-Update video metadata, thumbnail(secured)
-  `DELETE /:videoId`-Delete a video(secured)
- `PATCH /toggle/publish/:videoId`-Toggle publish status(secured)

**Likes** (`/api/v1/like/`)

- `POST /toggle/v/:videoId` -Toggle like on video(secured)
- `POST /toggle/c/:commentId` - Toggle like on comment(secured)
- `POST /toggle/t/:tweetId`  -Toggle like on tweet(secured)
- `GET /videos` - Videos liked by current user(secured)

**Subscriptions**(`/api/v1/subscription/`)

- `POST /c/:channelId` - Toggle subscription(secured)
- `GET /c/:channelId` -Get subscribers
- `GET /u/:subscriberId` -Get subscriptions of a user

**Comments** (`/api/v1/comment/`)

- `GET /:videoId` — Get comments (pagination)
- `POST /:videoId` -Add comment (secured)
- `delete /c/:commentId`- Delete comment
- `delete /c/:commentId`- Update the comment

**Dashboard** (`/api/v1/dashboard/`)

- `GET /stats`- Get channel statistics
- `GET /videos`- Get channel videos

**Twitter** (`/api/v1/tweet/`)

- `POST /`-Create a tweet
- `GET /user/:userId`- Get all tweets of a user
- `PATCH /:tweet`-Update a tweet
- `DELETE /:tweet`-Delete a tweet

**Playlist** (`/api/v1/playlist/`)

- `POST /`- Create a playlist
- `GET /:playlistId`- Get the playlist 
- `GET /:playlistId`- Update the Playlist
- `GET /:playlistId`- Delete the playlist
- `PATCH /add/:videoId/:palylistId`- Add a video to playlist
- `PATCH /remove/:videoId/:palylistId`- Remove a video to playlist
- `/user/:userId`-Get the user playlist

**Health Check** (`/api/v1/healthcheck/`)

- `GET /` - System health status


Here is the model link -->
[Model Link](https://app.eraser.io/workspace/qCBGPB0NpvSAjvnw1xe5?origin=)
