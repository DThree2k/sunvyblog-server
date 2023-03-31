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
    if (post.username === req.body.username) {
      try {
        await post.delete();
        res.status(200).json("Post has been deleted...");
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(401).json("You can delete only your post!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET POST
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL POSTS
router.get("/", async (req, res) => {
  const username = req.query.user;
  const catName = req.query.cat;
  const search = req.query.q;
  try {
    let posts;
    if (username) {
      posts = await Post.find({ username });
    } else if (catName) {
      
      posts = await Post.find({
        categories: {
          $in: [catName],
        },
      });
      
    } 
    else if (search) {
      posts = await Post.find({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { categories: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ],
      });
    }
     else {
      posts = await Post.find();
    }
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});
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
    });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
