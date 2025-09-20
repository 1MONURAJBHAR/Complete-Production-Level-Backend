class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export { ApiError }


/**super() calls the parent class constructor.
Since ApiError extends Error, super(message) runs the Error constructor with the message you provide.
This sets up the built-in properties of Error (like message and stack) correctly. 

super(message)
ensures that ApiError inherits all the normal Error behavior, 
while still letting you add extra API-specific fields (statusCode, errors, success, etc.).


In JavaScript, every Error object has a property called stack.
It’s basically a string that shows where the error happened (the call stack).

Without captureStackTrace, your error might look like it came from inside the ApiError class, not from your actual code where you threw it.
With it, debugging becomes much clearer.

This block ensures your error always has a useful stack trace:

Use the given one if provided.
Otherwise, auto-generate a clean one at the point the error happened.


******code logic*******
If a stack was passed in manually:
if (stack) {
    this.stack = stack
}

This lets you override the stack trace if you want.
Example: maybe you’re re-throwing an error and want to keep the original stack trace.
Otherwise, generate it automatically:

else {
    Error.captureStackTrace(this, this.constructor)
}

Error.captureStackTrace(targetObject, constructorFunction) is a V8 (Node.js/Chrome) feature.
It creates a stack trace starting from where the error is created.
Passing this.constructor tells it: don’t include the constructor itself in the trace, 
so your stack trace starts at the real point of failure, not inside the ApiError class.

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
📌 Example
class ApiError extends Error {
  constructor(message, stack = "") {
    super(message)

    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

function testError() {
  throw new ApiError("Something failed")
}

try {
  testError()
} catch (e) {
  console.log(e.stack)
}


Output:

ApiError: Something failed
    at testError (/app/index.js:12:9)
    at Object.<anonymous> (/app/index.js:16:3)
    ...


Notice ✅ the stack trace points to testError(), not inside the ApiError constructor.

*/