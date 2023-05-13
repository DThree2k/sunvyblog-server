const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");

//CREATE POST
router.post("/", async (req, res) => {
  const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});
// PUT api to update the status of a post by id
router.put('/lock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const post = await Post.findByIdAndUpdate(id, { status }, { new: true });
    if (!post) {
      return res.status(404).json({ error: 'Bài viết không tồn tại' });
    }
    return res.json(post);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

//UPDATE POST
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.username === req.body.username) {
      try {
        const updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          {
            $set: req.body,
          },
          { new: true }
        );
        res.status(200).json(updatedPost);
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(401).json("You can update only your post!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//ADD COMMENT TO POST
router.post("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const newComment = {
      profilePic: req.body.profilePic,
      username: req.body.username,
      commentText: req.body.commentText,
    };
    post.comments.push(newComment);
    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE POST
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
      try {
        await post.delete();
        res.status(200).json("Post has been deleted...");
      } catch (err) {
        res.status(500).json(err);
      }
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL POSTS STATUS TRUE
router.get("/", async (req, res) => {
  const username = req.query.user;
  const catName = req.query.cat;
  const search = req.query.q;
  try {
    let posts;
    if (username) {
      posts = await Post.find({ username, status: true }).sort({ createdAt: -1 });
    } else if (catName) {
      posts = await Post.find({
        categories: {
          $in: [catName],
        },
        status: true
      }).sort({ createdAt: -1 });
      
    } 
    else if (search) {
      posts = await Post.find({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { categories: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ],
        status: true
      }).sort({ createdAt: -1 });
    }
     else {
      posts = await Post.find({status: true});
    }
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});
//GET ALL POSTS
router.get("/adminPosts", async (req, res) => {
  try {
    const posts = await Post.find(); // sắp xếp giảm dần theo views
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});
//GET ALL POSTS HOT
router.get("/hot", async (req, res) => {
  try {
    const posts = await Post.find({status: true}).sort({ views: -1 , createdAt: -1}); // sắp xếp giảm dần theo views
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});
//GET ALL POSTS LASTEST
router.get("/lastest", async (req, res) => {
  try {
    const posts = await Post.find({status: true}).sort({ createdAt: -1}); // sắp xếp giảm dần theo views
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});
// GET TOP 10 NEWEST POSTS
router.get("/newest", async (req, res) => {
  try {
  const posts = await Post.find().sort({ createdAt: -1 }).limit(10); // lấy 10 bài viết mới nhất
  res.status(200).json(posts);
  } catch (err) {
  res.status(500).json(err);
  }
  });
// GET TOP 10 NEWEST POSTS BY AUTHOR
  router.get("/newest/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const posts = await Post.find({ username })
        .sort({ createdAt: -1 })
        .limit(10);
      res.json(posts);
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
  // GET TOP 10 HOTTEST POSTS
  router.get("/hottest", async (req, res) => {
  try {
  const posts = await Post.find().sort({ views: -1 , createdAt: -1}).limit(10); // lấy 10 bài viết nổi bật nhất
  res.status(200).json(posts);
  } catch (err) {
  res.status(500).json(err);
  }
  });
//GET POSTS BY TAG
router.get("/tags/:tag", async (req, res) => {
  const  tags  = req.params.tag;
  if (!tags) {
    return res.status(400).json({ message: "Tag is required" });
  }
  const tagsArr = tags.split(',');
  const tagsRegex = new RegExp(tagsArr.join("|"), "i");
  let posts;
  try {
    if (tagsArr.length > 1) {
      posts = await Post.find({ categories: { $regex: tagsRegex }, status: true }).sort({ createdAt: -1});
    } else {
      posts = await Post.find({
        categories: { $regex: new RegExp(tags, "i")}  , status: true
      }).sort({ createdAt: -1});
    }
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});
//GET TOTAL USERS POSTS TAGS 
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({isAdmin:false});
    const totalPosts = await Post.countDocuments();
    const categoryCounts = await Post.aggregate([
      { $unwind: "$categories" },
      { $project: { category: { $toLower: "$categories" } } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
        },
      },
    ]);
    const totalCategories = categoryCounts.length;
    const totalViews = await Post.aggregate([{ $group: { _id: null, totalViews: { $sum: "$views" } } }]);
    res.status(200).json({
      totalUsers,
      totalPosts,
      totalCategories,
      totalViews: totalViews[0].totalViews,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});
//GET NUMBER OF POSTS LAST 6 MONTHS
router.get('/monthly-count', async (req, res) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthlyCounts = [];

  for (let i = 6; i > 0; i--) {
    const monthAgo = new Date(currentYear, currentMonth - i, 1);
    const startOfMonth = new Date(monthAgo.getFullYear(), monthAgo.getMonth(), 1);
    const endOfMonth = new Date(monthAgo.getFullYear(), monthAgo.getMonth() + 1, 0, 23, 59, 59);

    const count = await Post.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    monthlyCounts.push({
      month: (monthAgo.getMonth() + 1).toString().padStart(2, '0') + '/' + monthAgo.getFullYear(),
      count
    });
  }

  res.json(monthlyCounts);
});
//GET NUMBER OF POSTS BY USER LAST 6 MONTHS
router.get('/monthly-count/:username', async (req, res) => {
  try {
  const { username } = req.params;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  // const posts = await Post.find({
  //   username,
  //   createdAt: { $gte: sixMonthsAgo },
  //   status: true,
  // }).select('createdAt');
  const months = [...Array(6)].map((_, i) => {
    const month = sixMonthsAgo.getMonth() + i;
    const year = sixMonthsAgo.getFullYear() + Math.floor(month / 12);
    const monthString = (month % 12 + 1).toString().padStart(2, '0');
    return { month: monthString, year };
  });

  const monthlyCounts = await Post.aggregate([
    { $match: { username, createdAt: { $gte: sixMonthsAgo }} },
    { $group: {
      _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
      count: { $sum: 1 },
    } },
  ]);

  const countsByMonth = months.map(({ month, year }) => {
    let adjustedMonth = parseInt(month) - 1;
    let adjustedYear = year;
    if (adjustedMonth < 0) {
      adjustedMonth = 11;
      adjustedYear--;
    }
    const match = monthlyCounts.find(({ _id }) => _id.month === adjustedMonth + 1 && _id.year === adjustedYear);
    const formattedDate = new Date(`${adjustedYear}-${adjustedMonth + 1}-01`).toLocaleString('default', { month: 'numeric', year: 'numeric' });
    return { month: formattedDate, count: match ? match.count : 0 };
  });
  res.json(countsByMonth);
} catch (err) {
  res.status(500).json(err);
}
});

router.get("/category/count", async (req, res) => {
  try {
    const categoryCounts = await Post.aggregate([
      { $unwind: "$categories" },
      {
        $group: {
          _id:{ $toLower: "$categories" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0, // Loại bỏ field _id
          id: "$_id", // Tạo field mới có tên là id với giá trị từ field _id
          count: 1, // Giữ nguyên field count
        },
      },
    ]);
    res.status(200).json(categoryCounts);
  } catch (err) {
    res.status(500).json(err);
  }
});
//GET LIST TAGS BY TOTAL POSTS, TOTAL VIEWS, TOTAL COMMENTS, TOTAL BOOKMARK
router.get('/categories', async (req, res) => {
  try {
    const result = await Post.aggregate([
      // Đầu tiên, chúng ta phải tách các categories ra thành các document riêng biệt
      // bằng cách sử dụng unwind.
      { $unwind: '$categories' },
      // Sau đó, chúng ta nhóm các bài viết theo category và tính tổng số lượng bài viết,
      // tổng số lượt xem, tổng số bình luận và tổng số lượt bookmark cho mỗi category.
      {
        $group: {
          _id: { $toLower: '$categories' },
          totalPosts: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalComments: { $sum: { $size: '$comments' } },
          totalBookmarks: { $sum: { $size: '$bookmarks' } },
        },
      },
      // Thêm thuộc tính id với giá trị bằng _id chuyển đổi sang kiểu String
      {
        $project: {
          id: { $toString: '$_id' },
          totalPosts: 1,
          totalViews: 1,
          totalComments: 1,
          totalBookmarks: 1,
        },
      },
      // Sắp xếp kết quả theo thứ tự tăng dần của category.
      { $sort: { _id: 1 } },
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.get('/categories/:tag', async (req, res) => {
  const category = req.params.tag;
  try {
    const result = await Post.find({
      categories: { $regex: new RegExp(category, 'i') },
      // status: true
    }).sort({ createdAt: 'desc' });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//GET POST
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    post.views += 1;
    await post.save();
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});
//GET POST BY ADMIN
router.get("/admin/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});
// GET BÀI LIÊN QUAN VÀ BÀI KHÁC CỦA TÁC GIẢ
router.get("/:id/related", async (req, res) => {
  try {
    // Find the post by ID
    const post = await Post.findById(req.params.id);
    // Get the post's tags
    const tags = post.categories;
    // Find all posts with at least one of the same tags
    const relatedPosts = await Post.find({ categories: { $regex: new RegExp(tags.join("|"), "i") }, id: { $ne: post.id } }).sort({ createdAt: -1});
    res.status(200).json(relatedPosts);
  } catch (err) {
    res.status(500).json(err);
  }
});
// GET  AUTHOR POSTS
router.get("/:id/author", async (req, res) => {
  try {
    // Find the post by ID
    const post = await Post.findById(req.params.id);
    // Find all posts by the same author
    const authorPosts = await Post.find({ username: post.username, id: { $ne: post.id } }).sort({ createdAt: -1});
    res.status(200).json(authorPosts);
  } catch (err) {
    res.status(500).json(err);
  }
});
//GET POSTS BY KEYWORD
router.get("/search/:keyword", async (req, res) => {
  const searchQuery  = req.params.keyword;
  try {
    let posts;
     posts = await Post.find({
      $or: [
        { title: { $regex: searchQuery, $options: "i" } },
        { categories: { $regex: searchQuery, $options: "i" } },
        { username: { $regex: searchQuery, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});
//GET BOOKMARK POSTS OF USER
router.get("/:id/bookmarks", async (req, res) => {
  const postId = req.params.id;
  const username = req.query.username;

  try {
    const post = await Post.findById(postId);
    const bookmarks = post.bookmarks;
    if (bookmarks.includes(username)) {
      return res.json(true );
    } else {
      return res.json(false );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
//POST BOOKMARK POST BY USER
router.post("/:id/:username", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.bookmarks.includes(req.params.username)) {
      return res.status(400).json({ message: "Post already bookmarked" });
    }
    post.bookmarks.push(req.params.username);
    await post.save();
    return res.status(200).json({ message: "Bookmark saved successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
//GET POSTS BY USER IN BOOKMARK
router.get("/bookmards/:username", async (req, res) => {
  try {
  const username = req.params.username;
    // Tìm các bài viết có username trong mảng bookmarks
    const posts = await Post.find({ bookmarks: username });
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
//DELETE AUTHOR IN POST
router.delete("/:id/:username", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.bookmarks.includes(req.params.username)) {
      return res.status(400).json({ message: "User has not bookmarked this post" });
    }
    post.bookmarks = post.bookmarks.filter((username) => username !== req.params.username);
    await post.save();
    return res.status(200).json({ message: "Bookmark removed successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
