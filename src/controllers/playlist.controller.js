import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new playlist
const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body;
  
  if (!name || !description) {
    throw new ApiError(400, "Playlist name and description are required");
  }
                   //inside playlist collection creating a new playlist
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
    video: [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));

});

// Get all playlists of a user
const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  const { userId } = req.params;
  
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Inavlid user ID");
  }
           //Inside Playlist collection i want all that playlist document whose owner id's are equal to userId.
  const playlists = await Playlist.find({ owner: userId }).populate("video").populate("owner", "username fullName avatar");

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "user playlist fetched successfully"))
  

});

// Get a playlist by ID
const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  const { playlistId } = req.params;
  
  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID")
    
  }
          //find a playlist inside playlist collection by its playlistId
  const playlist = await Playlist.findById(playlistId).populate("video").populate("owner", "fullName username avatar")
  
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
  

});


// Add a video to playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError(200, "Invalid playlist or video ID");
  }
  
  const playlist = await findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { video: videoId } //prevents duplicate
    },
    {
      new: true
    }
  ).populate("video");


  if (!playlist) {
    throw new ApiError(404, "Playlist not found")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to playlist"));

});


// Remove a video from playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  const { playlistId, videoId } = req.params;

  if (
    !mongoose.isValidObjectId(playlistId) ||
    !mongoose.isValidObjectId(videoId)
  ) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }

  /**$pull:If videoId exists in the playlist’s video array → it gets removed.
     If it doesn’t exist → nothing happens, MongoDB just skips. */
  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { video: videoId },
    },
    {
      new: true,
    }
  ).populate("video");

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed from playlist"));
});

// Delete a playlist
const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  const { playlistId } = req.params;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(404, "Invalid playlist ID");
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);

  if (!playlist) { //this playlist contains the deleted playlist document
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(404, "Playlist not found")
  
});

// Update a playlist
const updatePlaylist = asyncHandler(async (req, res) => {
  //TODO: update playlist
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $set: { name, description } },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(404,"Playlist not found")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));

});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};


/**$push: { video: videoId } → always adds the videoId to the array, even if it already exists → ❌ you can get duplicates.
$addToSet: { video: videoId } → only adds videoId if it’s not already present in the array → ✅ prevents duplicates automatically.
So in your playlist schema, since video is an array of ObjectIds, $addToSet is the correct choice for addVideoToPlaylist. */


/**In MongoDB:
$addToSet: { video: videoId } → adds videoId only if it doesn’t exist already (prevents duplicates).

$pull: { video: videoId } → removes all occurrences of videoId from the array (if present).

👉 Example in your removeVideoFromPlaylist controller:

await Playlist.findByIdAndUpdate(
  playlistId,
  { $pull: { video: videoId } },
  { new: true }
);


If videoId exists in the playlist’s video array → it gets removed.
If it doesn’t exist → nothing happens, MongoDB just skips.

⚡ So you’ll use:
$addToSet → when adding videos (to prevent duplicates).
$pull → when removing videos (clean removal). */