//require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  //path: './.env' → means you are telling dotenv to look for a file literally named .env ,.
  path: "./.env",
});

/**dotenv.config()-->It’s a function from the dotenv package.
Its job: read your .env file and load the variables into process.env. */


 
connectDB()














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