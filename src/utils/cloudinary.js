import { v2 as cloudinary } from "cloudinary"; // ✅ correct

import fs from "fs"


//This configuration is important for uploading files,pdf,images,videos,audios to cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
      if (!localFilePath) return null; //if the file path not found return null
      //upload the file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto",
      });

      //file has been uploaded successfully
      console.log("file is uploaded on cloudinary ", response.url);
      //console.log("This is response object",response);
      

      // Remove the local file after successful upload
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath); //means delete a file from your local filesystem.
      }

      return response;  //It will return an object which conations a lot of info like size,url,type & etc..
                          //It is returning this response object to the  DB/Frontend
    } catch (error) {
      // Remove local file even if upload fails
      if (fs.existsSync(localFilePath)) {  //Remove the locally saved temporary file as the upload operation got failed
        fs.unlinkSync(localFilePath);
      }

      //console.error("Error uploading file to Cloudinary:", error);
      return null;


      
    }
}



// delete function
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return null; // if publicId not provided return null

    // delete the file from cloudinary
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType, // "image", "video", or "raw"
    });

    console.log("file deleted from cloudinary", response);

    return response; // returns an object { result: 'ok' } or { result: 'not found' }
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    return null;
  }
};











export { uploadOnCloudinary, deleteFromCloudinary };



  /**fs.unlinkSync(localFilePath);
means delete a file from your local filesystem.

Breakdown:
fs → Node’s built-in File System module.
unlink → Function used to remove (delete) a file.
Sync → Means it runs synchronously (blocking). The program will stop and wait until the file is deleted before continuing.
localFilePath → The full path (like "./uploads/file.png") to the file you want to delete. */
  
  
/**When you upload a file to Cloudinary with:
const response = await cloudinary.uploader.upload("myphoto.jpg");
console.log("file is uploaded on cloudinary ", response.url);

🔑 What’s happening
cloudinary.uploader.upload() sends your file to Cloudinary servers.
Cloudinary responds with a response object that contains many details about the uploaded file.
Example response (simplified):

{
  "asset_id": "abc123",
  "public_id": "myphoto",
  "version": 1690000000,
  "url": "http://res.cloudinary.com/dddj9gqwz/image/upload/v1690000000/myphoto.jpg",
  "secure_url": "https://res.cloudinary.com/dddj9gqwz/image/upload/v1690000000/myphoto.jpg",
  "format": "jpg",
  "bytes": 123456
}
✅ Why we use response.url (or better response.secure_url)
response.url → gives the HTTP link to the uploaded file.
response.secure_url → gives the HTTPS link (recommended, more secure).

We console.log() it so we can:
Verify upload worked
→ If you see a valid URL, your file is live on Cloudinary.
Get the hosted link
→ You can save it in your database or send it back to the frontend so the client app can display the image.
Example

const result = await cloudinary.uploader.upload("myphoto.jpg");
console.log("✅ File uploaded:", result.secure_url);
// Save in DB
await User.updateOne({ _id: userId }, { profilePic: result.secure_url });

👉 So:
Upload → get response → extract url/secure_url → use in app (DB/frontend)
Would you like me to show you the most common fields in Cloudinary’s upload response and when to use them (e.g., public_id, secure_url, */

  
  
/****************************************************************************************************************** */
  
//How uploadOnCloudinary() gets the local path 
/**1. localFilePath comes from the file uploaded via Multer
When you use multer with diskStorage, the uploaded file is saved 
on your server in a folder you specified (./public/images in your example).
Example Multer setup:
import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./public/images"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage: storage });


Then in your route:

app.post("/upload", upload.single("image"), async (req, res) => {
  console.log(req.file); 
  // req.file.path contains the local path of the uploaded file
  const localPath = req.file.path;

  const cloudResponse = await uploadOnCloudinary(localPath);

  res.send(cloudResponse);
});

2. What req.file contains
After multer saves the file, req.file is an object like this:

{
  "fieldname": "image",
  "originalname": "myphoto.png",
  "encoding": "7bit",
  "mimetype": "image/png",
  "destination": "./public/images",
  "filename": "1695201223456-myphoto.png",
  "path": "./public/images/1695201223456-myphoto.png",
  "size": 123456
}


The local path is req.file.path.
That is exactly what you pass to uploadOnCloudinary(localFilePath).

3. How your function uses it
const cloudResponse = await uploadOnCloudinary(req.file.path);
cloudinary.uploader.upload(localFilePath) reads the file from that path.

After successful upload, you call:

fs.unlinkSync(localFilePath);

This deletes the file from the server.

✅ In short:
localFilePath is the path of the file saved by Multer on your server, usually found in req.file.path. Multer handles the creation of the file in the folder you specify,
 and your function just uses that path to upload and later delete it. */