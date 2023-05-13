const mongoose = require('mongoose');
const shortid = require('shortid');
const reportSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => shortid.generate()
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
reportSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    // Chuyển đổi _id thành id kiểu String
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});
const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
