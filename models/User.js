const mongoose = require("mongoose");
const shortid = require('shortid');
const UserSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => shortid.generate()
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
      required: true,
    },
    profilePic: {
      type: String,
      default: "",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: "",
    },
    otpCreatedAt: {
      type: Date,
    },
  },
  { timestamps: true}
);
UserSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    // Chuyển đổi _id thành id kiểu String
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});
module.exports = mongoose.model("User", UserSchema);
