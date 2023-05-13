const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_MAILER_CLIENT_ID = '501351886225-1gcg1ljuaetj2a1pvdbg9b5o11gvh32b.apps.googleusercontent.com'
const GOOGLE_MAILER_CLIENT_SECRET = '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'
const GOOGLE_MAILER_REFRESH_TOKEN = '1//04gCw7KeqT7anCgYIARAAGAQSNwF-L9Irbaw6yZHcd30c6H6LSfvsfe4td8GqWREoQILGJePcQybdPFTdWVKq3HfHooRsMolcK_w'
const ADMIN_EMAIL_ADDRESS = 'dthree2882000@gmail.com'
const myOAuth2Client = new OAuth2Client(
  GOOGLE_MAILER_CLIENT_ID,
  GOOGLE_MAILER_CLIENT_SECRET
)
myOAuth2Client.setCredentials({
  refresh_token: GOOGLE_MAILER_REFRESH_TOKEN
})
//REGISTER
router.post("/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPass,
    });
    const otp = crypto.randomBytes(3).toString("hex").toUpperCase();
    newUser.verificationCode = otp
    newUser.otpCreatedAt = new Date(); // Thời điểm tạo mã OTP
    const user = await newUser.save();
    const myAccessTokenObject = await myOAuth2Client.getAccessToken()
    const myAccessToken = myAccessTokenObject?.token
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: 'OAuth2',
        user: ADMIN_EMAIL_ADDRESS,
        clientId: GOOGLE_MAILER_CLIENT_ID,
        clientSecret: GOOGLE_MAILER_CLIENT_SECRET,
        refresh_token: GOOGLE_MAILER_REFRESH_TOKEN,
        accessToken: myAccessToken
      }
    });
    const mailOptions = {
      to: user.email,
      subject: 'Sunvy - Xác thực tài khoản',
      html: `
    <div style="font-size: 16px; font-weight: bold;">
      Mã xác thực của bạn là <span style="color: blue;">${otp}</span>.
    </div>
    <div style="font-size: 14px; margin-top: 10px;">
      Mã xác thực này sẽ hết hạn sau 5 phút.
    </div>
  `
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Đăng ký thành công!' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Đã có lỗi xảy ra!' });
  }
});
router.post("/verify", async (req, res) => {
  const { email, verificationCode } = req.body;
  const user = await User.findOne({ email });
  if (user && user.verificationCode === verificationCode) {
    const now = new Date();
    const otpCreatedAt = user.otpCreatedAt;
    const diffInMinutes = Math.floor((now - otpCreatedAt) / (1000 * 60));
    if (diffInMinutes > 5) {
      // Nếu mã OTP đã hết hạn
      res.status(400).send("Mã xác thực đã hết hạn!");
    } else {
      user.verified = true;
      await user.save();
      res.status(200).send("Xác thực thành công!");
    }
  } else {
    res.status(400).send("Mã xác thực không hợp lệ!");
  }
});
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const otp = crypto.randomBytes(3).toString("hex").toUpperCase();
    user.verificationCode = otp;
    user.otpCreatedAt = new Date();
    await user.save();
    const mailOptions = {
      to: user.email,
      subject: "Sunvy - Xác thực tài khoản",
      html: `
        <div style="font-size: 16px; font-weight: bold;">
          Mã xác thực của bạn là <span style="color: blue;">${otp}</span>.
        </div>
        <div style="font-size: 14px; margin-top: 10px;">
          Mã xác thực này sẽ hết hạn sau 5 phút.
        </div>
      `,
    };
    const myAccessTokenObject = await myOAuth2Client.getAccessToken()
    const myAccessToken = myAccessTokenObject?.token
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: 'OAuth2',
        user: ADMIN_EMAIL_ADDRESS,
        clientId: GOOGLE_MAILER_CLIENT_ID,
        clientSecret: GOOGLE_MAILER_CLIENT_SECRET,
        refresh_token: GOOGLE_MAILER_REFRESH_TOKEN,
        accessToken: myAccessToken
      },
    });
    await transporter.sendMail(mailOptions);
    res.json({ message: "Mã xác thực mới đã được gửi đến email của bạn" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Đã có lỗi xảy ra!" });
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(401).json("Sai email");
    if (!user.verified) return res.status(400).json("Wrong credentials!");
    const validated = await bcrypt.compare(req.body.password, user.password);
    if (!validated) return res.status(402).json("Sai mật khẩu");
    if (!user.status) return res.status(403).json("Tài khoản đã bị khoá");
    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
