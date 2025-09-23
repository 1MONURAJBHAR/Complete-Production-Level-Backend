import mongoose, { Schema } from "mongoose"

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //one who is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, //one to whom "subscriber" is subscribing
      ref: "User",
    },
  },
  { timestamps: true }
);








































/**Here’s what’s happening:

subscriber: {
  type: Schema.Types.ObjectId, // the user who is subscribing
  ref: "User",                 // refers to the User collection
},
channel: {
  type: Schema.Types.ObjectId, // the user who is being subscribed to
  ref: "User",                 // also refers to the User collection
},

Meaning
subscriber: The user who follows or subscribes.
channel: The user who is being followed or subscribed to.
Both are referencing the User collection because both the subscriber and the channel are users.

Example

Let’s say:
User A subscribes to User B.
Then in the Subscription collection, you’ll have:

{
  "subscriber": "ObjectId(123...)", // User A's ID
  "channel": "ObjectId(456...)"    // User B's ID
}

This way you can track who subscribes to whom. */