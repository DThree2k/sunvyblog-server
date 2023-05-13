const mongoose = require("mongoose");
const shortid = require('shortid');
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
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => shortid.generate()
    },
    title: {
      type: String,
      required: true,
      unique: true,
    },
    desc: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
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
    },
    bookmarks: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);
PostSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    // Chuyển đổi _id thành id kiểu String
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});
module.exports = mongoose.model("Post", PostSchema);
