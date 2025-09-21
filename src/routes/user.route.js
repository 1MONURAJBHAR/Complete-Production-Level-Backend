import { Router } from "express"
import { registerUser } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();
                                   //api/v1/users/? iske baad jo bhi hum dalenge vo execute ho jayega
router.route("/register").post(   //example:api/v1/users/register -->toh phir control pehle middleware per phir registerUser pe jayega
  upload.fields([ // upload.fields()--> middleware
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  registerUser
); //As soon as you hit /register, then register method will get executed/called.

export default router;






//Read from bottom
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
  avatar: [
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

✅ Easy language meaning:
👉 req.files?.avatar[0]?.path
means:
“If req.files exists, and it has an avatar field, and that field has at least one file, 
then give me the file path of the first avatar file. Otherwise, return undefined without error.” */





/************************************************************************************************************************ */




/**upload.array(fieldname, maxCount)
Use when you want to upload multiple files from the SAME field in your form.
Example:

app.post("/upload", upload.array("photos", 5), (req, res) => {
  console.log(req.files); // array of files
  res.send("Uploaded multiple photos!");
});


👉 Here the form input should be like:
<input type="file" name="photos" multiple>
All uploaded files come in req.files (array).
maxCount = maximum number of files allowed for that field.


🔹 upload.fields(fieldsArray)
Use when you want to upload multiple files from DIFFERENT fields in your form.
Example:

app.post("/upload", upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "documents", maxCount: 5 }
]), (req, res) => {
  console.log(req.files);
  res.send("Uploaded avatar + documents!");
});


👉 The form might look like:
<input type="file" name="avatar">
<input type="file" name="documents" multiple>


req.files.avatar → array with 1 file (avatar)

req.files.documents → array with up to 5 files

✅ Easy way to remember:
array → many files, one field
fields → many files, many fields 


upload.single(fieldname)
Use when you want to upload only one file from one field.
Example:

app.post("/profile", upload.single("avatar"), (req, res) => {
  console.log(req.file); // single file
  res.send("Avatar uploaded!");
});


👉 The form should have:

<input type="file" name="avatar">

The uploaded file will be available in req.file (not req.files).

✅ Easy way to remember:
single → 1 file (→ req.file)
array → many files, same field (→ req.files)
fields → many files, many fields (→ req.files.fieldName)*/