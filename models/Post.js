const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  profilePic: {
    type: String,
    required: false,
  },
  username: {
    type: String,
    required: true,
  },
  commentText: {
    type: String,
    required: true,
  },
},
{ timestamps: true });

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    desc: {
      type: String,
      required: true,
    },
    photoDesc: {
      type: Array,
      required: false,
    },
    photo: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: "",
    },
    categories: {
      type: Array,
      required: false,
    },
    comments: [CommentSchema],
    views: {
      type: Number,
      default: 0,
      min: 0,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", PostSchema);
