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

*/