const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
               .catch((err) => next(err))
    }
}

    

export default asyncHandler
   







//const asyncHandler = () => {}    //Normal function
//const asyncHandler = (func) =>{()=>{}}  or
//const asyncHandler = (func) => () => {}   //we are passing a function a parameter inside another function
//const asyncHandler = (func) => async() => {}   //making that func async



//This of try catch
/*const asyncHandler = (func) => async (req, res, next) => {
    try {
        await func(req,res,next)
    } catch (error) {
        res.status(err.code || 500).json({
            success:false,
            message: err.message    
        })
    }
}; */