const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const bcrypt = require("bcrypt");

//UPDATE
router.put("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (req.body.userId === req.params.id) {
    const salt = await bcrypt.genSalt(10);
    { req.body.password === user.password ? (req.body.password) : (req.body.password = await bcrypt.hash(req.body.password, salt)) }
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      await Post.updateMany(
        { username: user.username },
        { $set: { profilePic: updatedUser.profilePic, username: updatedUser.username } }
      );
      res.status(200).json(updatedUser);
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(401).json("You can update only your account!");
  }
});
// router.put("/:username", async (req, res) => {
//   const { username } = req.params.username;
//   const { newUsername, newProfilePic } = req.body;

//   try {
//     const updatedPosts = await Post.updateMany(
//       { username: username },
//       { $set: { username: newUsername, profilePic: newProfilePic } },
//       { new: true }
//     );

//     res.status(200).json(updatedPosts);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });
router.put('/lock/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { status } = req.body;
    const updatedUser = await User.findOneAndUpdate({ username }, { status: status }, { new: true });
    res.json(updatedUser);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});
//DELETE
router.delete("/:id", async (req, res) => {
  if (req.body.userId === req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      try {
        await Post.deleteMany({ username: user.username });
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json("User has been deleted...");
      } catch (err) {
        res.status(500).json(err);
      }
    } catch (err) {
      res.status(404).json("User not found!");
    }
  } else {
    res.status(401).json("You can delete only your account!");
  }
});
// GET ALL USERS
// router.get("/", async (req, res) => {
//   try {
//     const users = await User.find({ isAdmin: false });
//     const result = users.map(user => {
//       const { password, ...others } = user._doc;
//       return others;
//     });
//     res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });
router.get("/", async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }); // Lấy danh sách user không phải admin
    const posts = await Post.aggregate([
      // { $match: { status: true } }, // Lọc các post có trạng thái "true"
      {
        $group: {
          _id: "$username",
          count: { $sum: 1 }, // Đếm số bài viết theo username
        },
      },
    ]);

    // Tạo một object mới chứa thông tin user và số bài viết của user
    const result = users.map(user => {
      const foundPost = posts.find(post => post._id === user.username);
      const postCount = foundPost ? foundPost.count : 0;
      // Tìm số bài viết của user
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        profilePic: user.profilePic,
        postCount: postCount,
      };
    });

    return res.json(result); // Trả về danh sách user và số bài viết của user
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET USER
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
