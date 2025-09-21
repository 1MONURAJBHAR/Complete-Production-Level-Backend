import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
          `${process.env.MONGODB_URI}/${DB_NAME}`
        );
        console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`); // connectionInstance.connection gives the actual MongoDB connection. , .host tells you the hostname of the MongoDB server your app connected to.
    } catch (error) {
      console.log("MongoDB connection error ", error);
      process.exit(1); //exit from process no.1, read Nodejs Docs for more info || ChatGPT
      //process.exit(1) is a Node.js command used to immediately stop the running process.
    }
}

export default connectDB; 

/**process → A global Node.js object that gives information and control over the current running Node.js process.
.exit(code) → A method that ends the process with the given exit code.

Exit codes:
0 → Success (no errors, everything went fine).
1 (or any non-zero value) → Failure (something went wrong).
So:

process.exit(1);
🔹 Immediately terminates the Node.js program.
🔹 Returns exit code 1 to the operating system, signaling that the process ended with an error. */