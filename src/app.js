import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//basic configurations
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.route.js'  //importing router from routes

//routes declaration
app.use("/api/v1/users", userRouter)  ///api/v1/users--> jaise hi ye hit hoga control "userRouter" i.e-->"router"  pe chala jayega

//http://localhost:8000/api/v1/users/register


export { app }

