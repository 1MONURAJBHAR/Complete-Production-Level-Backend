import mongoose, { Schema } from "mongoose";
//import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";  //Although we can add but no need.


const playlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required:true
        },
        description: {
            type: String,
            required:true
        },
        video: [//multiple videos inside a playlist
            {
                type: Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        owner: { //playlist owner
            type: Schema.Types.ObjectId,
            ref:"User"
        }
    },
{ timestamps: true })




//playlistSchema.plugin(mongooseAggregatePaginate);  //Although we can add but no need.
export const Playlist = new mongoose.model("Playlist", playlistSchema);

