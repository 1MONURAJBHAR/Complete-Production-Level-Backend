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








/**app.use(cookieParser())
is used in an Express.js app to enable parsing cookies from incoming HTTP requests.

🔎 Breakdown:
cookie-parser → a middleware that reads cookies from the request headers.
Without it, if a request comes with cookies (in the Cookie header), you’d have to manually parse the string.
With it, Express automatically makes cookies available as a neat object on req.cookies.

Example without cookie-parser:
HTTP request header:

makefile
Copy code
Cookie: token=abc123; theme=dark
In raw Express, you’d have to parse that string manually.

Example with cookie-parser:
js
Copy code
import express from "express";
import cookieParser from "cookie-parser";

const app = express();

// Enable cookie parsing
app.use(cookieParser());

app.get("/", (req, res) => {
  console.log(req.cookies); 
  // 👉 { token: "abc123", theme: "dark" }
  res.send("Cookies parsed!");
});
⚡ Why do we use it?
To read cookies (e.g., session ID, JWT, CSRF token).

To easily access values like req.cookies.token.

Makes authentication & sessions simpler.

✅ With signed cookies
You can also pass a secret:

js
Copy code
app.use(cookieParser("mySecret"));
Then cookies signed with "mySecret" are available in req.signedCookies.

⚠️ Important: cookie-parser only reads cookies — it does not set them.
For setting cookies, you use res.cookie("name", "value") */