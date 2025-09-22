//The key thing is: dotenv must be loaded before you access process.env. Using import "dotenv/config"; at the very top ensures that.

import dotenv from "dotenv";  //old classic method must explicitly call dotenv.config(),Only after calling config() are your environment variables available via process.env.//Explicit control over .env file path,Can call it multiple times if needed.
import "dotenv/config"; //Its explanation is written down, use only one methd here currently i am using both one at a time,becoz there is problem in configuering the .env variables from root directory.

import connectDB from "./db/index.js"; 
import { app } from "./app.js";


dotenv.config({   //it will inject variable from this path of .env
  //path: './.env' → means you are telling dotenv to look for a file literally named .env ,. // loads .env file into process.env
  path: "./.env",
});

/**dotenv.config()-->It’s a function from the dotenv package.
Its job: read your .env file and load the variables into process.env. */


 
connectDB()  //since it is async method it will return a promise, so handle with .then()&.catch()
    .then(() => {
      //promise will either be resolve or will be reject

      app.on("error", (error) => {
        console.log("❌ Server level error: ", error);
        throw error;
      });

      app.listen(process.env.PORT || 8000, () => {
        //Now the server will listen to the database via port 8000 || process.env.PORT
        console.log(`✅ Server is running at port : ${process.env.PORT}`);
      });
    })  
    .catch((err) => {
      //.then if promise resolve & .catch if promise reject, i.e resolve hota hai toh .then() handle karega, & reject hota hai toh .catch() handel karega.
        console.log("❌ MongoDB connection Failed !!! ", err);
    })  






       


    /*  ✅ simple way  //this is new feature directly calls doteve.config() and .env file must be in project root directory
      .env is directly loaded into proccess.env using this new feature
           
      It automatically calls dotenv.config() with default settings, it does not need to inject any variable from .env explicitly, (shown in terminal injecting(0) from .env i.e: implicitly injects --> import "dotenv/config";)
      By default, dotenv looks for a file named .env in your project root.
      If it does not find a .env file there, it silently fails. No error is thrown; process.env stays empty. */




    /**app (your Express application) is basically an EventEmitter In Node.js, EventEmitter lets you listen to events using .on(eventName, callback).
       * This means:
       If your Express app emits an "error" event (like server start failure, invalid port, etc.),
       → it will log the error and throw it.

       🔹 How it works in flow
       connectDB() succeeds → you start the server with app.listen(...).
       If something goes wrong with the server (e.g., port already in use, permission denied):
       Node will emit an "error" event on the app.
       Your app.on("error") callback will catch it.
       Example:
       Error:  listen EADDRINUSE: address already in use :::8000
       This would trigger your app.on("error") handler.

       🔹 Difference from .catch() in connectDB
       .catch() handles DB connection errors only.
       app.on("error") handles server-level runtime errors (not DB).

       So they’re different error domains:
       DB fails → .catch().
       Server fails → app.on("error").

       So, in short:
       app.on("error") is a listener for server-related errors, while .catch() is for DB promise rejection.
      */

/**Clearing confusion of injecting 0 env variables from terminal */
/**import "dotenv/config";
This is ESM shorthand. It automatically calls dotenv.config() once, using the default path (./.env in your project root).
Environment variables are immediately available via process.env.
It logs [dotenv@17.2.2] injecting env (10) from .env the first time you start, showing how many variables were successfully loaded.

2️⃣ import dotenv from "dotenv"; + dotenv.config({ path: "./.env" });
This is the classic explicit method. You import dotenv as a module, then manually call dotenv.config() with optional options like a custom path.
Important: If you have already used import "dotenv/config" before this, dotenv.config() will not inject variables a second time, because dotenv avoids overwriting existing variables.
That’s why after using both, you see:
[dotenv@17.2.2] injecting env (0) from .env

Meaning: dotenv checked .env again but found no new variables to inject—they are already in process.env.

✅ Key takeaway
Do not mix import "dotenv/config" and dotenv.config() in the same file. Pick one method:
import "dotenv/config" → simplest, automatic.
import dotenv from "dotenv"; dotenv.config({ path: "./.env" }) → explicit, gives control over path or debug options.
Mixing them causes the “injecting env (0)” message, but it’s not an error—it’s just a warning that nothing new was injected. */

/*
import express from "express";
const app = express();

//()() ---> IIFE functions,  IIFE = Immediately Invoked Function Expression.
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("Error: ",error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);     
        })
    } catch (error) {
        console.error("Error: ", error)
        throw err
    }
    
})()*/



/**app.on(...) is trying to listen for an event on your Express app object.
You used "error"  as the event name.
Inside the callback, if the event fires, it will log the error and then throw it.

app.listen(port, callback) starts an HTTP server on the port you set in .env file (process.env.PORT).
When the server is successfully running, the callback logs a confirmation message.
Example: if your .env has PORT=4000, you’ll see:

App is listening on port 4000*/