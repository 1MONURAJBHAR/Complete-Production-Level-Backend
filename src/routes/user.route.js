import { Router } from "express"
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser)  //As soon as you hit /register, then register method will get executed/called.

export default router;