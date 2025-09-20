//require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  //path: './.env' → means you are telling dotenv to look for a file literally named .env ,.
  path: "./.env",
});

/**dotenv.config()-->It’s a function from the dotenv package.
Its job: read your .env file and load the variables into process.env. */


 
connectDB()  //since it is async method it will return a promise, so handle with .then()&.catch()
    .then(() => {
      //promise will either be resolve or will be reject

      app.on("error", (error) => {
        console.log("Server level error: ", error);
        throw error;
      });

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

      app.listen(process.env.PORT || 8000, () => {
        //Now the server will listen to the database via port 8000 || process.env.PORT
        console.log(`Server is running at port : ${process.env.PORT}`);
      });
    })  
    .catch((err) => {
      //.then if promise resolve & .catch if promise reject, i.e resolve hota hai toh .then() handle karega, & reject hota hai toh .catch() handel karega.
        console.log("MongoDB connection Failed !!! ", err);
    })  














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