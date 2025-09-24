import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const commentSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  video: {
    type: Schema.Types.ObjectId,
    ref: "Video"
    },
  owner: {
      type: Schema.Types.ObjectId,
      ref:"User"
  }
}, { timestamps: true });



commentSchema.plugin(mongooseAggregatePaginate);
export const Comment = new mongoose.model("Comment", commentSchema);
















/**What it does
commentSchema → This is your Mongoose schema for comments.
.plugin() → Mongoose allows you to attach reusable functionality to schemas using plugins.
mongooseAggregatePaginate → This is a plugin (from the mongoose-aggregate-paginate or mongoose-aggregate-paginate-v2 package) that adds pagination support for aggregation queries.

🔹 Why it’s useful

Normally, if you do a Mongoose aggregate:

const result = await Comment.aggregate([
  { $match: { postId: someId } },
  { $sort: { createdAt: -1 } }
]);


You get all matching documents, no pagination.
If you have hundreds or thousands of comments, fetching all at once is slow.
With the plugin, you can do:

const options = { page: 1, limit: 10 };
const result = await Comment.aggregatePaginate(aggregateQuery, options);


Only fetch 10 comments per page.

Gives you total pages, total docs, next page, prev page, etc.

🔹 How to set it up
import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new mongoose.Schema({
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
}, { timestamps: true });

// Add the plugin
commentSchema.plugin(mongooseAggregatePaginate);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;

🔹 Usage example
const aggregateQuery = Comment.aggregate([
  { $match: { post: postId } },
  { $sort: { createdAt: -1 } }
]);

const options = { page: 1, limit: 5 };

const result = await Comment.aggregatePaginate(aggregateQuery, options);

console.log(result);


result.docs → array of comments for this page
result.totalDocs → total number of matching comments
result.totalPages → total pages*/