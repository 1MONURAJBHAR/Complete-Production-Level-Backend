import asyncHandler from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponce } from "../utils/ApiResponce.js"

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
  const coverImageLocalPath = req.files?.coverimage?.[0]?.path; //middleware file ko dest pe upload kerdeta hai with unique file name, uske baad vo ek object deta hai jisme  array fields hote (ex: {avatar:[{},{},{}.....{}], coverimage:[{},{}.....{}]<--object files inside array field -->coverimage}) hain aur un array field ke andar bahut saare files ke object hote hain,
                                                            //  req.files hame ek object-->{} deta hai, jisme saari info hoti hai including path usi ki ko access kar re hain

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
    "-password -refreshToken  "
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

export { registerUser }




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