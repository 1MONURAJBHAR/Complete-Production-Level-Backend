import multer from "multer"

import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {  //cb --> callback function, In express req.body can hold/warp/configure only json data not file,thats why we use multer.
                                             //multer gives us the fuctionality to upload files, express does not have that capability.
    cb(null, "./public/images"); // folder to save files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // custom filename
  },
});

export const upload = multer({ storage: storage });



/**destination: function (req, file, cb) {
  cb(null, 'uploads/'); // folder to save files
}
Here’s what it means step by step:

1. destination function
Tells Multer where to save the uploaded file on the server.
Receives three parameters:
req → the incoming request object
file → the file being uploaded
cb → a callback function you must call to tell Multer the folder path

2. cb(null, 'uploads/')
cb is called with two arguments:
The first argument is an error. Here it’s null, meaning no error.
The second argument is the destination folder path where the file should be saved.
'uploads/' → relative path in your project. Multer will create files inside this folder.

3. Important notes
The folder must exist; Multer does not automatically create it.
If it doesn’t exist, you need to create it manually or programmatically:

javascript
Copy code
import fs from 'fs';
const dir = './uploads';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
You can also make it dynamic based on user or file type:

javascript
Copy code
destination: function (req, file, cb) {
    const folder = 'uploads/' + req.user.id;
    cb(null, folder);
}

✅ Summary:
That line tells Multer: “Save the uploaded file inside the uploads/ folder and there’s no error.” */


/**filename: function (req, file, cb) {
  cb(null, Date.now() + "-" + file.originalname); // custom filename
}
Let’s break it down step by step:

1. Purpose of filename
Determines what the uploaded file will be named on the disk.
Without this, Multer would give files random names, which can be confusing.

2. cb(null, ...)
Just like destination, cb takes two arguments:
First: error → here null means no error.
Second: the string for the filename you want to save.

3. Date.now() + "-" + file.originalname
Date.now() → gives the current timestamp in milliseconds.
Example: 1695212345678
file.originalname → the original name of the uploaded file from the client.

Example: myphoto.png
Combined:
text
Copy code
1695212345678-myphoto.png
This makes the filename unique, so multiple uploads won’t overwrite each other.

4. Why it’s important
Prevents name collisions (two users uploading photo.png at the same time).
Keeps the original file name for reference.
Allows timestamped ordering if needed later.

✅ Summary:
This line tells Multer: “Save the uploaded file with a unique name made by combining the current timestamp and the original file name.” */





/**How the local path is determined:
destination function:
This tells multer where to save the uploaded file on your server.
"./public/images" is relative to the folder where you run your Node.js server (usually the root folder of your project).
Example: If your project structure is:

project-root/
  server.js
  public/
    images/

Then the file will be saved in project-root/public/images/.

filename function:
This sets the name of the uploaded file.
Date.now() + "-" + file.originalname ensures:
A unique timestamp prefix (Date.now()) to avoid overwriting files.
Keeps the original file name for reference.
multer automatically combines both:
When a file is uploaded, multer internally combines destination and filename to get the full local path.

Example:

destination: "./public/images"
filename: "1695201223456-myphoto.png"
Full path: "./public/images/1695201223456-myphoto.png"
Accessing the local path in your route:
When using multer in your Express route like:

app.post("/upload", upload.single("image"), (req, res) => {
  console.log(req.file.path); // This is the local path
  res.send("File uploaded!");
});


req.file.path will give the exact local path of the uploaded file on your server.

So basically:
Destination folder → where the file goes.
Filename → how it’s named.
multer combines both to create the local path, which you can then use to upload the file to Cloudinary or delete it afterward. */















/************************************************************************************************************************************************** */
/**DiskStorage
Definition: Stores uploaded files directly on the disk (your server’s filesystem).
Use case: When you want to save files permanently, like images, PDFs, etc.

Implementation in Multer:
import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // folder to save files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // custom filename
  }
});

const upload = multer({ storage: storage });

Pros:
Files are persisted even after the server restarts.
Works well for large files.

Cons:
Slower than memory because it writes to disk.
You have to manage storage space.

2. MemoryStorage
Definition: Stores uploaded files in memory as a Buffer temporarily.
Use case: When you want to process files immediately (like resizing an image or uploading to a cloud storage) without saving on disk.

Implementation in Multer:
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

Pros:
Fast, because it’s in memory.
Useful for temporary operations or cloud uploads.

Cons:
Limited by server memory; large files may crash the server.
Files are lost if the server restarts.

✅ Summary Table
Feature	            DiskStorage	               MemoryStorage
Location	        Server disk	                   Server RAM
Persistence      	Permanent until deleted    	   Temporary (lost on restart)
Speed            	Slower (disk I/O)	           Faster (in-memory)
Use Case	        Saving files on server	       Processing files for cloud or manipulation

So in short:
Use DiskStorage if you need the file saved on your server.
Use MemoryStorage if you just want to handle it in memory temporarily, e.g., for uploading to Cloudinary, AWS S3, etc.




where this diskstorage and memory storage lie 
                    or
where DiskStorage and MemoryStorage “exist” or reside in the system. Let’s clarify carefully:

1. DiskStorage
Physical location: On your server’s hard drive (or SSD).

How it works:
When a file is uploaded, Multer writes it as a physical file in the folder you specify (uploads/ or any path).

Example: uploads/image123.png now exists on disk.
Implication: You can open it, move it, or back it up just like any other file on your computer/server.
So basically, DiskStorage is “on disk”, literally in a directory on the server.

2. MemoryStorage
Physical location: In the server’s RAM (memory).

How it works:
When a file is uploaded, Multer keeps it in memory as a Buffer object.
It doesn’t touch the disk unless you explicitly write it later.

Implication:
It’s very fast.
Temporary: if the server restarts or crashes, the file is gone.
So MemoryStorage is “in memory”, just like variables or objects in your running Node.js process.

Visual analogy:
[Client uploads file]
        |
        V
  +----------------+
  |  Node.js App   |
  +----------------+
        |
        |-- DiskStorage --> saved as file on disk: /uploads/file.png
        |
        |-- MemoryStorage --> saved in RAM as Buffer: file.buffer

In short:
DiskStorage → Hard Drive (permanent until deleted).
MemoryStorage → RAM (temporary, lost on server restart).
If you want, I can also explain why people prefer MemoryStorage for cloud uploads like Cloudinary or S3—it’s actually very common in modern apps. Do you want me to do that? */