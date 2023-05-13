  const router = require("express").Router();
  const Report = require('../models/Report');
  const Post = require('../models/Post');
const User = require('../models/User');
  // API để gửi báo cáo về bài viết
  router.post('/', async (req, res) => {
      try {
          const { post, user, reason } = req.body;
          const report = new Report({
              post,
              user,
              reason,
          });
          await report.save();
          res.status(200).json({ message: 'Report submitted successfully.' });
      } catch (err) {
          console.error(err);
          res.status(500).json({ message: 'Internal server error' });
      }
  });
  // API để hiển thị danh sách các báo cáo
  router.get('/', async (req, res) => {
    try {
      const reports = await Report.aggregate([
        // Tìm kiếm những báo cáo có status là pending và sắp xếp theo thời gian tạo gần nhất
        { $match: { status: 'pending' } },
        { $sort: { createdAt: -1 } },
        // Kết nối bảng Report và Post để lấy các trường _id và title của bài viết
        {
          $lookup: {
            from: 'posts',
            localField: 'post',
            foreignField: '_id',
            as: 'post',
          },
        },
        // Kết nối bảng Report và User để lấy các trường username và profilePic của user
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        // Chọn các trường cần hiển thị
        {
          $project: {
            'post._id': 1,
            'post.title': 1,
            'user.username': 1,
            'user.profilePic': 1,
            id: 1,
            reason: 1,
            status: 1,
            createdAt: 1,
          },
        },
        // Gộp kết quả lại với những báo cáo có status khác pending
        {
          $unionWith: {
            coll: 'reports',
            pipeline: [
              { $match: { status: { $ne: 'pending' } } },
              { $sort: { createdAt: -1 } },
              {
                $lookup: {
                  from: 'posts',
                  localField: 'post',
                  foreignField: '_id',
                  as: 'post',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'user',
                  foreignField: '_id',
                  as: 'user',
                },
              },
              {
                $project: {
                  'post._id': 1,
                  'post.title': 1,
                  'user.username': 1,
                  'user.profilePic': 1,
                  id: 1,
                  reason: 1,
                  status: 1,
                  createdAt: 1,
                },
              },
            ],
          },
        },
      ]);
      res.status(200).json( reports );
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // API trả về số lượng báo cáo có status là pending
router.get('/pending-count', async (req, res) => {
  try {
      const count = await Report.countDocuments({ status: 'pending' });
      res.status(200).json({ count });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
  }
});
  // API để xem chi tiết một báo cáo
  router.get('/:id', async (req, res) => {
      try {
        const report = await Report.findById(req.params.id).populate('postId userId', 'title username');
    
        if (!report) {
          return res.status(404).json({ message: 'Report not found.' });
        }
    
        res.status(200).json(report);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
    // PUT request to update the status of a report
  router.put('/:reportId', async (req, res) => {
      try {
        const { reportId } = req.params;
        const { status } = req.body;
    
        // Validate status
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: 'Invalid status' });
        }
    
        // Find the report by ID
        const report = await Report.findById(reportId)
        .populate('post', '_id title')
      .populate('user', 'username profilePic');
        if (!report) {
          return res.status(404).json({ message: 'Report not found' });
        }
    
        // Update the status of the report
        report.status = status;
        await report.save();
    
        // Return the updated report
        // res.status(200).json(report);
        res.status(200).json({
          _id: report._id,
          id: report.id,
          reason: report.reason,
          status: report.status,
          createdAt: report.createdAt,
          post: [{
            _id: report.post._id,
            title: report.post.title
          }],
          user:  [{
            username: report.user.username,
            profilePic: report.user.profilePic
          }]})
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
    
  module.exports = router;

