import asyncHandler from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponce } from "../utils/ApiResponce.js"
import { subcriptions } from "../models/subcription.model.js"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation - not empty
  //chack if user already exists: username,email
  //check for images, check for avatar
  //upload them to cloudinary, avatar
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return response

  const { fullName, email, username, password } = req.body; //We get user data when it comes from body, if it comes from url use req.params
  // console.log("email ", email);
 // console.log("This is req.body object", req.body);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "") //it will check that each field is there
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    //It will find inside the DB either username or either email.
    $or: [{ username }, { email }], //findOne & findById are the database calls i.e : find inside the database
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path; //Jo file user ne upload kari hain vo file temporarily server ke uper hoti hai kisi folder me, toh unka path nikal rahe hain yaha per ,cloudinary me un file ko upload kerne ke liye
  const coverImageLocalPath = req.files?.coverimage?.[0]?.path; //middleware file ko dest pe upload kerdeta hai with unique file name, uske baad vo ek object deta hai jisme  array fields hote (ex: {avatar:[{},{},{}.....{}], coverimage:[{},{}.....{}]<--object files inside array field -->coverimage}) hain aur un array field ke andar bahut saare files ke object hote hain.

  //  req.files hame ek object-->{} deta hai, jisme saari info hoti hai including path usi ki ko access kar re hain
  //console.log("This is req.files object ", req.files); //check it by debugging it on terminal
  //console.log("This is req.files?.avatar?.[0] object ", req.files?.avatar?.[0]); //check it by debugging it on terminal, //req.files ke andar avatar field array ke andar jo 0th index pe file object hai vo log karo

  //another method
  /*let coverImageLocalPath;   //similarly we can do for avatarLocalPath also 
  if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
    coverImageLocalPath = req.files.coverimage[0].path;
  }*/


  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverimage = await uploadOnCloudinary(coverImageLocalPath);

  /*console.log("Avatar path", avatar);  //For only debugging purpose
  console.log("coverimage", coverimage);*/

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required now");
  }

  const user = await User.create({
    //"User" directly interacts with the database & creates this object in the database
    fullName, // & store it in variable named user
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    //find the user with his id from the database, here "User" directly interacts with the database
    "-password "
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(
    new ApiResponce(
      200, //statuscode
      createdUser, //Data
      "user registered successfully" //message
    )
  );
})


const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); //Save the document to MongoDB, but skip running Mongoose validators before saving. Directly pushes the document to MongoDB. see below for more info

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500,"Something went wrong while generating access and refresh token")
  }
}



const loginUser = asyncHandler(async (req, res) => {
  //fetch data from req.body
  //find username or email
  //find the user
  //Password check
  //access and refresh token
  //send cookie

  const { email, username, password } = req.body;

  if (!username && !email) {
    //or (!(username || email)) this is also correct
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({    /**User.findOne() is an asynchronous mongoose function.It returns a Promise, not the actual user document.Hence must use "await"*/
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  //Here "User"-->it is object of mongoose from mongodb so using this we can access only methods given by mongoose like findById(),findOne() & etc..
  //"user"--> it is our user which we have taken from the database, using this we can access the custom methods like isPasswordcorrect(),generateAccessToken(),generateRefreshToken()
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponce(
        200,
        {
          //we are resending this acctkn & rfshtkn becs if user wants to save these tokens in their local storage then they can do it, and also in mobile apps no cookies are stored so this is important.
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In successfully"
      )
    );
})

 

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id, //This req.user will come from verifyJWT midleware
    {
      $unset: { refreshToken: 1 },   //This removes the field from document
    },
    {
      new: true, //{ new: true } → Makes sure you get back the updated document instead of the old one.
    }
  );


  const options = {
    httpOnly: true,
    secure: true,
  };


  return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponce(200, {}, "User logged Out Successfully"))
  
})



const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  
    const user = await User.findById(decodeToken?._id);
  
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
  
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
  
    const options = {
      httpOnly: true,
      secure: true,
    };
  
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );
  
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponce(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }

  /**user is a Mongoose document (an object representing a MongoDB document).
    refreshToken: newRefreshToken--> This line updates the refreshToken field in memory.
    refreshToken is usually long-lived, used only to generate a new short-lived access token when it expires.
    If you just assign it but don’t call save(), it won’t persist in MongoDB.
    Always ensure your schema defines it:refreshToken: { type: String, default: null }
 */
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  
  //if we provide confirm password field then write this code also
  // if(!(newPassword === confPassword)){
  //   throw new ApiError(401,"new password and confirm password must be same")
  // } 


  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400,"Invalid old password")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })
  
  return res
    .status(200)
    .json(new ApiResponce(200, {}, "Password changed successfully"))
  
})


const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponce(200, req.user, "current user fetched successfully"));
  
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body
  
  if (!fullName || !email) {
    throw new ApiError(400,"All fields are required")
  }
  
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName, //or fullName only
        email: email     //or email only
      }
    },
    {
      new:true
    }
  ).select("-password")


  return res
    .status(200)
    .json(new ApiResponce(200, user, "Account details updated succcessfully"))
  

})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path; //This is only "file" not "files" since we are updating only one file

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  /*const user = await User.findById(req.user._id).select("-password ")

  user.avatar = avatar.url
  await user.save({ validateBeforeSave: false})*/
  /****************OR************************** */
  /*const user = await User.findByIdAndUpdate( 
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");*/

  // ✅ Find the user first to get old avatar
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // ✅ Delete old avatar if it exists
  if (user.avatar) {
    await deleteFromCloudinary(user.avatar);
  }

  // ✅ Update with new avatar
  user.avatar = avatar.url;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponce(200, req.user, "Avatar Updated successfully")); //use "req.user"-->coming from verifyJWT(automatically excludes refreshToken and password) not "user"--> coming from DB(cantain all whole document information)
})


const updateUserCoverimage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover image file is missing");
  }

  const coverimage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverimage.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  /*const user = await User.findById(req.user._id).select("-password ")

  user.coverimage = coverimage.url
  await user.save({ validateBeforeSave: false})*/
  /***************OR************************* */
  /*const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverimage: coverimage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");*/

  // ✅ Find the user first to get old avatar
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // ✅ Delete old avatar if it exists
  if (user.coverimage) {
    await deleteFromCloudinary(user.coverimage);
  }

  // ✅ Update with new avatar
  user.coverimage = coverimage.url;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponce(200, req.user, "Cover image Updated successfully"));  //use "req.user"-->coming from verifyJWT(automatically excludes refreshToken and password) not "user"--> coming from DB(cantain all whole document information)
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params
  
  if (!username?.trim()) {
    throw new ApiError(400,"username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        //This will give me the user document form the mongodb as my username matches.
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        //channel ko kitne logo ne subscribe kiya
        from: "subcriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers", //subscribers field-->(array of objects) ko add kar do user document me, isme saare subscriptions ke objects jinki channel ki id meri local id se match kar rhi hai, vo hai.
      },
    },
    {
      $lookup: {
        //user ne kitne channel jo subscribe kiya
        from: "subcriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo", //subscribedTo field-->(array of objects) ko add kar do user document me, isme saare subscriptions ke objects jinki subcriber ki id meri local id se match kar rhi hai, vo hai.
      },
    },
    {
      $addFields: {
        //add fields to user document
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {   //$in ---> ye array and objects dono ke andar dekhta hai
            if: { $in: [req.user?.id, "$subscribers.subscriber"] },
            then: true,
            else: false
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverimage: 1,
        email: 1
      }
    }

  
  ]);

  if (!channel?.length) {
    throw new ApiError(404,"channel does not exist")
  }

  return res
    .status(200)
    .json(new ApiResponce(200, channel[0], "User channel fetched successfully"))
  

})

const getWatchHistory = asyncHandler(async (req, res) => {
  //console.log(req.user._id); --> for debugging
  
  const user = await User.aggregate([
    {
      $match: {
         _id: req.user._id
       }
    },
    {
      $lookup: {
        from: "videos",
        localField: "WatchHistory",
        foreignField: "_id",
        as: "WatchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner" 
                       //or
                //$arrayElemAt: ["owner",0]
              }
            }
          }
        ]
      }
    }
  ])


  return res
    .status(200)
    .json(new ApiResponce(
      200,
      user[0].watchHistory,
      "Watch History fetched successfully"
  ))
})



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverimage,
  getUserChannelProfile,
  getWatchHistory,
};
  

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  
  /**. Why you see user[0]

When you use aggregation pipeline (User.aggregate([...])), the result is always an array of documents.

So if you run:

const user = await User.aggregate([
  { $match: { _id: mongoose.Types.ObjectId(req.user._id) } },
  { $lookup: { ... } }
]);


The result is like:

[
  {
    _id: ObjectId("u123"),
    fullName: "Monu",
    watchHistory: [ObjectId("v1"), ObjectId("v2")]
  }
]


That’s why you need user[0] to get the first document.

2. user[0].watchHistory

This means → “from the first document in the result array, access the watchHistory field”.

Example:

console.log(user[0].watchHistory);


Might print:

[
  ObjectId("v1"),
  ObjectId("v2")
]

3. If you want to avoid user[0]

If you only expect one document, you can instead use:

const user = await User.findById(req.user._id).populate("watchHistory");


or if you stick with aggregation, you can do:

const [user] = await User.aggregate([
  { $match: { _id: mongoose.Types.ObjectId(req.user._id) } },
  { $lookup: { ... } }
]);

console.log(user.watchHistory);


Here, destructuring (const [user] = ...) makes user the first document directly, so no need for user[0]. */
  

 / //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /**Your aggregation code:

$lookup: {
  from: "videos",
  localField: "WatchHistory",
  foreignField: "_id",
  as: "WatchHistory"
}

🔎 Explanation

from: "videos"
→ Tells MongoDB which collection to join with. Here it’s the videos collection.

localField: "WatchHistory"
→ The field in your current collection (say, users) that stores references.
Example: A user document might look like:

{
  "_id": "u123",
  "name": "Monu",
  "WatchHistory": [
    ObjectId("a1"),
    ObjectId("a2"),
    ObjectId("a3")
  ]
}


Here WatchHistory is an array of video _ids.

foreignField: "_id"
→ The field in the videos collection that matches the values from WatchHistory.
In videos, each document has an _id:

{
  "_id": ObjectId("a1"),
  "title": "Intro to MongoDB",
  "duration": 10
}


as: "WatchHistory"
→ The name of the new array field that will be added to your result documents after the join.
Since you used the same name as localField, it will replace your original array of ObjectIds with an array of full video documents.

🔗 How it works

So for a given user:

{
  "_id": "u123",
  "name": "Monu",
  "WatchHistory": [ObjectId("a1"), ObjectId("a2")]
}


After $lookup, you’ll get:

{
  "_id": "u123",
  "name": "Monu",
  "WatchHistory": [
    {
      "_id": ObjectId("a1"),
      "title": "Intro to MongoDB",
      "duration": 10
    },
    {
      "_id": ObjectId("a2"),
      "title": "Aggregation Deep Dive",
      "duration": 15
    }
  ]
}


✅ In short:
This $lookup is fetching all the video documents whose _id values match the ids in the user’s WatchHistory array, and embedding them in place of WatchHistory. */
  
  
  
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /**The Code
{
  $lookup: {
    from: "users",             // collection to join with
    localField: "owner",       // field in current collection (e.g., "videos.owner")
    foreignField: "_id",       // field in "users" collection to match with
    as: "owner",               // name of the output array field
    pipeline: [                // additional processing on the joined documents
      {
        $project: {            // choose only specific fields
          fullName: 1,
          username: 1,
          avatar: 1
        }
      }
    ]
  }
}

🔎 What happens here

from: "users"
→ We’re joining with the users collection.

localField: "owner"
→ In your current collection (say videos), there’s a field owner that stores the user’s _id.
Example:

{
  "_id": ObjectId("vid123"),
  "title": "MongoDB Tutorial",
  "owner": ObjectId("u456")
}


foreignField: "_id"
→ In users collection, we match against the _id field.
Example:

{
  "_id": ObjectId("u456"),
  "fullName": "Monu Rajbhar",
  "username": "monu123",
  "avatar": "profile.jpg",
  "email": "monu@example.com",
  "password": "hashed..."
}


as: "owner"
→ The result will add an owner array containing the matched user document(s).

pipeline
→ Before embedding the user document, MongoDB runs the given pipeline on it.
Here you’re using $project to only keep fullName, username, and avatar.
Fields like email, password, etc. will be excluded.

📌 Example Result

After this $lookup, your videos document will look like:

{
  "_id": ObjectId("vid123"),
  "title": "MongoDB Tutorial",
  "owner": [
    {
      "fullName": "Monu Rajbhar",
      "username": "monu123",
      "avatar": "profile.jpg"
    }
  ]
}


✅ In short:
This lookup replaces the owner user id with detailed user info, but only selected fields (name, username, avatar), keeping the response lean and secure. */
  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  
  /**.populate("watchHistory")
does in Mongoose.

🔎 What populate("watchHistory") means
In your User schema, you likely have something like:

js
Copy code
const userSchema = new Schema({
  fullName: String,
  watchHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video"   // reference to Video collection
    }
  ]
});
When you fetch a user with:

js
Copy code
const user = await User.findById(req.user._id).populate("watchHistory");
Without populate, user.watchHistory is just an array of ObjectIds:

json
Copy code
[
  "652a8f0b23d...",
  "652a8f1c89b..."
]
With populate, Mongoose automatically replaces those ObjectIds with the full documents from the videos collection:

json
Copy code
[
  {
    "_id": "652a8f0b23d...",
    "title": "Intro to MongoDB",
    "duration": 10
  },
  {
    "_id": "652a8f1c89b...",
    "title": "Aggregation Deep Dive",
    "duration": 15
  }
]
📌 Customizing populate
You can also choose which fields to return:

js
Copy code
const user = await User.findById(req.user._id)
  .populate("watchHistory", "title duration");
Result:

json
Copy code
"watchHistory": [
  { "_id": "652a8f0b23d...", "title": "Intro to MongoDB", "duration": 10 },
  { "_id": "652a8f1c89b...", "title": "Aggregation Deep Dive", "duration": 15 }
]
✅ In short:
.populate("watchHistory") tells Mongoose:
👉 “Instead of just ObjectId references, go fetch the actual Video documents and embed them here.” */
  
  


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  
  /**Got it 👍 Let’s break down your subscriptionSchema line by line:

📌 subscriber
subscriber: {
  type: Schema.Types.ObjectId, // one who is subscribing
  ref: "User",
}


This field stores the user who is doing the subscribing.
It’s an ObjectId (MongoDB’s unique ID type) that points to the User collection.
ref: "User" tells Mongoose that this field is a reference → so you can later use .populate("subscriber") to get the full subscriber’s user details instead of just the ID.

📌 channel
channel: {
  type: Schema.Types.ObjectId, // one to whom "subscriber" is subscribing
  ref: "User",
}


This field stores the user who is being subscribed to (the "channel owner").
It’s also an ObjectId referencing the User collection.
Example: If Monu subscribes to Hitesh →
subscriber = Monu’s _id

channel = Hitesh’s _id

So essentially:

subscriber → follower

channel → person being followed

📌 timestamps: true
{ timestamps: true }


Automatically adds two fields:

createdAt → when subscription was created

updatedAt → when subscription was last modified

📌 Model export
export const subcriptions = new mongoose.model("subcriptions", subscriptionSchema)
Creates a Mongoose model called "subcriptions" (typo: should be "subscriptions" ✅).
This will create a MongoDB collection named subcriptions (lowercased, pluralized).
Now you can use methods like subcriptions.find(), subcriptions.create(), etc.

✅ Example

If Monu follows Hitesh, the document in subscriptions collection will look like:

{
  "_id": "650f7f8c4f1a",
  "subscriber": "64ffabc12345",  // Monu’s User ID
  "channel": "64ffxyz67890",     // Hitesh’s User ID
  "createdAt": "2025-09-23T14:20:00.000Z",
  "updatedAt": "2025-09-23T14:20:00.000Z"
} */
  

  
  
/// / ///////////////////////////////////////////////////////////////////////////////////////

  
  /**{ "_id": 1, "name": "Alice" }
{ "_id": 2, "name": "Bob" }
And your subcriptions collection has:

json
Copy code
{ "subscriber": 101, "channel": 1 }
{ "subscriber": 102, "channel": 1 }
{ "subscriber": 103, "channel": 2 }
If you run your $lookup:

js
Copy code
$lookup: {
  from: "subcriptions",
  localField: "_id",
  foreignField: "channel",
  as: "subscriber"
}
The result will be:

json
Copy code
{
  "_id": 1,
  "name": "Alice",
  "subscriber": [
    { "subscriber": 101, "channel": 1 },
    { "subscriber": 102, "channel": 1 }
  ]
}
{
  "_id": 2,
  "name": "Bob",
  "subscriber": [
    { "subscriber": 103, "channel": 2 }
  ]
}
So the subscriber field is an array containing all subscription documents where the user is the channel.

You can then easily count subscribers with:

js
Copy code
{ $project: { name: 1, subscriberCount: { $size: "$subscriber" } } }
Result:

json
Copy code
{ "name": "Alice", "subscriberCount": 2 }
{ "name": "Bob", "subscriberCount": 1 } */
  

  

  
  
  

  
  
/**$lookup: {
    from: "subcriptions",      // The collection to join with
    localField: "_id",         // Field from the current collection (e.g., User)
    foreignField: "channel",   // Field in "subcriptions" collection
    as: "subscriber"           // Name of the new array field to hold matched docs
}
What it does:
You have a User collection (or something similar) and a subcriptions collection.
Each document in subcriptions represents a subscription: { subscriber: ObjectId, channel: ObjectId }.
You want to know how many people have subscribed to a particular channel.

Here’s the flow:
For each document in your main collection (likely users), _id of that user is matched against channel in the subcriptions collection.
All matching subscription documents are added as an array in the field subscriber.
Later, you can count them using $size or $project:

js
Copy code
{
  $project: {
    username: 1,
    subscriberCount: { $size: "$subscriber" }
  }
}
✅ This will give you each user and the number of subscribers they have. */



  
  
  
  
  //adding a field to mongodb
  /**
   * user.refreshToken = refreshToken;
     await user.save({ validateBeforeSave: false });
user is a Mongoose document (the actual user object fetched from DB).

You assign a new value to its refreshToken property →
this updates the document in memory.

await user.save() writes those changes back to MongoDB.

So in your users collection, the document will now have (or update) the field:

json
Copy code
{
  "_id": "652abc123...",
  "fullName": "John Doe",
  "email": "john@example.com",
  "username": "john",
  "password": "hashed-password",
  "avatar": "cloudinary-link",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR..."
}
⚠️ Important:

If your User schema does not have a refreshToken field defined, Mongoose will still add it dynamically (because MongoDB is schemaless at core).
But it’s better practice to define it explicitly in your schema:

js
Copy code
refreshToken: {
  type: String,
  default: null
}
This way, you avoid bugs and ensure type consistency. */


  


  




  


  
  
  

  
  
  
  /**{ new: true }
is usually seen in Mongoose (MongoDB ODM for Node.js).

👉 Example:

js
const updatedUser = await User.findByIdAndUpdate(
  userId,
  { username: "newName" },
  { new: true }   // 👈 this
);
Meaning of { new: true }
By default, findByIdAndUpdate (and similar update methods) returns the old document (the one before update).

When you pass { new: true }, it makes Mongoose return the updated document instead.

So:

Without { new: true } → you get the old version.

With { new: true } → you get the updated version. ✅ */
  
  
  
  
  
  
  


/**
 * 
 * await user.save({ validateBeforeSave: false })
means:

👉 Save the document to MongoDB, but skip running Mongoose validators before saving.
Normally:
When you do:

await user.save()
Mongoose runs all schema validations (required, unique, minlength, match, custom validators, etc.) before saving.

If validation fails → it throws an error and does not save.
With { validateBeforeSave: false }:
Skips schema validation.
Directly pushes the document to MongoDB.

Useful when:
You want to update only 1–2 fields and don’t want other required fields to be validated again.
You are making internal updates (e.g., updating only a token or a timestamp).
You trust the data and don’t need to revalidate. */













/**
 * cloudinary returns a JSON object with a lot of details. Example:

{
  asset_id: "d6a9f8eaa2...",
  public_id: "my_folder/my_avatar",
  version: 1694857300,
  version_id: "abc123",
  signature: "xyz456",
  width: 400,
  height: 400,
  format: "jpg",
  resource_type: "image",
  created_at: "2025-09-21T08:12:00Z",
  tags: [],
  bytes: 123456,
  type: "upload",
  etag: "78eabf...",
  placeholder: false,
  url: "http://res.cloudinary.com/demo/image/upload/v1694857300/my_folder/my_avatar.jpg",
  secure_url: "https://res.cloudinary.com/demo/image/upload/v1694857300/my_folder/my_avatar.jpg",
  folder: "my_folder",
  original_filename: "avatar",
}

🔹 Commonly used fields:
secure_url → ✅ the HTTPS link to your uploaded file (most important).
public_id → unique identifier in Cloudinary (needed if you want to delete/update the file later).
format, width, height → info about the image.
✅ Easy language meaning:
👉 The avatar variable is an object returned by Cloudinary after uploading.
It contains the file’s URL, ID, size, type, and other metadata. */

//////////////////////////////////////////////////////////////////////////////////////////////////////////

/**File vs Field

A file is the actual uploaded thing (image, PDF, video, etc.).
In Multer, each uploaded file is represented as an object with details like:

{
  fieldname: 'avatar',
  originalname: 'mypic.png',
  encoding: '7bit',
  mimetype: 'image/png',
  destination: 'uploads/',
  filename: '12345-mypic.png',
  path: 'uploads/12345-mypic.png',
  size: 12345
}


Each file object tells you:
Which field it came from (fieldname)
Its original name (originalname)
Where it’s stored (path)
Type (mimetype), size, etc.

🔹 Field

A field is the <input> in your HTML form.

Example:

<input type="file" name="avatar">
<input type="file" name="documents" multiple>


Here:
"avatar" is one field.
"documents" is another field.
Each field can accept one or many files depending on multiple and Multer config.

🔹 In Multer terms:

upload.single("avatar") → one file from one field.
req.file → the file object.

upload.array("documents", 5) → multiple files from the same field.
req.files → array of file objects.

upload.fields([{ name: "avatar" }, { name: "documents" }]) → multiple fields, each with files.

req.files.avatar → array of file objects from "avatar" field.
req.files.documents → array of file objects from "documents" field.

✅ Easy way to remember:
Field = the form input name (like "avatar", "documents")
File = the actual uploaded item (image, pdf, etc.) */
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**req.files
This comes from Multer when you use upload.fields([...]).

Example:

app.post("/upload", upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "documents", maxCount: 5 }
]), (req, res) => {
  console.log(req.files);
});


Then req.files looks like:

{
  avatar: [   // array of file objects
    {
      fieldname: 'avatar',
      originalname: 'mypic.png',
      encoding: '7bit',
      mimetype: 'image/png',
      destination: 'uploads/',
      filename: '123456-mypic.png',
      path: 'uploads/123456-mypic.png',
      size: 12345
    }
  ],
  documents: [ ... ]
}


req.files?.avatar

?. = optional chaining (safe check).

If req.files doesn’t exist (e.g., no files uploaded), it won’t throw an error → it just returns undefined.
If it exists, we get the array for the avatar field.

req.files?.avatar[0]

The first file uploaded in the avatar field (index 0).
Since avatar was defined with maxCount: 1, this will usually be just one file.

req.files?.avatar[0]?.path

Again, safe-checked with ?..
Gets the path where the uploaded avatar image is stored on the server.

Example: "uploads/123456-mypic.png"

✅ Easy language meaning
👉 req.files?.avatar[0]?.path
means:
“If req.files exists, and it has an avatar field, and that field has at least one file, 
then give me the file path of the first avatar file. Otherwise, return undefined without error.” */

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**User.findOne(...) → searches in the User collection, returns the first matching document.
$or: [...] → MongoDB operator that means “match if at least one condition is true”.
[{ username }, { email }] → shorthand for:
{ username: username } OR { email: email } */
/******************************************************************** */
/**Solution → ?. (optional chaining)
With ?., JavaScript will safely check if the value exists before trying to access its property/method.
Example:
let user = null;
console.log(user?.name); // ✅ undefined (no error)

🔹 In your code:
field?.trim()


If field is a string → it will call .trim() normally.
If field is null or undefined → it will stop and return undefined (instead of throwing an error).

🔹 Simple analogy:
Think of ?. like “knock on the door before entering” 🏠.
If the object exists → enter and check property.
If it doesn’t exist → just return undefined quietly (no crash). */

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**req.params → used when the value comes from URL path parameters (also called route parameters).
Example:

app.get("/user/:id", (req, res) => {
  console.log(req.params.id); // URL: /user/123  → "123"
  res.send(req.params.id);
});


Here :id is part of the URL path itself.
req.query → used when the value comes from query string in the URL.
Example:

app.get("/search", (req, res) => {
  console.log(req.query.q); // URL: /search?q=nodejs  → "nodejs"
  res.send(req.query.q);
});

Here q comes after ? in the URL.
req.body → used when the value comes from the request body (e.g., form submission, JSON payload in POST/PUT requests).

app.post("/login", (req, res) => {
  console.log(req.body.username); // from POST body JSON
  res.send(req.body.username);
});


✅ So the statement “if it comes from URL use req.params” is only partially true.
Use req.params if it’s in the route path (/user/:id).
Use req.query if it’s in the query string (/search?q=node). 



🔹 req.params
Comes from the URL path.
Defined in your route with a : (colon).
Example:

app.get("/user/:id", (req, res) => {
  res.send("User ID is " + req.params.id);
});


👉 If you visit /user/101, then req.params.id = "101"

🔹 req.query
Comes from the ?key=value part of the URL.
Useful for filters, searches, options, etc.
Example:

app.get("/search", (req, res) => {
  res.send("You searched for " + req.query.q);
});


👉 If you visit /search?q=node, then req.query.q = "node"

✅ Easy way to remember:
params = part of the path
query = after the ? in the URL*/