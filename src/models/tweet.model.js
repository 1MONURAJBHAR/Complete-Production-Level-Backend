import mongoose, { Schema } from "mongoose";
//import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";  //Although we can add but no need.


const tweetSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required:true
        },
        owner: { 
            type: Schema.Types.ObjectId,
            ref:"User"
        }
    },
{ timestamps: true })




//playlistSchema.plugin(mongooseAggregatePaginate);  //Although we can add but no need.
export const Tweet = new mongoose.model("Tweet", tweetSchema);

