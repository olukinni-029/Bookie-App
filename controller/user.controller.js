const User = require("../model/user.model");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { createJwtToken, verifyJwtToken } = require("../middleware/token");
const { OTP, message } = require("../utils/message");
const nodemailer = require("nodemailer");
let { PASSWORD, EMAIL } = process.env;

exports.userSignup = async (req, res) => {
  try {
    const { phoneNumber, password, email } = req.body;
    if (!(phoneNumber || password || email)) {
      res.status(400).json("Invalid phone number,password or email");
      return;
    }
    // check duplicate phone Number
    const phoneExist = await User.findOne({ phoneNumber });
    if (phoneExist) {
      res.status(400).json({ message: "phone number already exist" });
      return;
    }
    // check for email
    const checkEmail = await User.findOne({ email });
    if (checkEmail) {
      res.status(400).json({ message: "email already exist" });
      return;
    }
    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    // create user
    const user = await User.create({
      phoneNumber,
      password: hashPassword,
      email,
      role: phoneNumber === process.env.ADMIN_PHONE ? "Admin" : "User",
      phoneOtp:OTP,
    });
    // Generate Otp, save and send to the user
    let userNumber = user.phoneNumber;
    const config = {
      method: "post",
      url: `https://account.kudisms.net/api/?username=${EMAIL}&password=${PASSWORD}&message=${message}&sender=Bookie&mobiles=0${userNumber}`,
      headers: {},
    };
    // fetch the kudisms 
    const resp = await axios(config);
    res.status(201).json({
      message: "OTP  sent successfully",
      user,
      userId: user._id,
    });
    console.log(resp.data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error:error.message });
  }
};

// resend otp
exports.resendOtp = async (req, res) => {
  try {
    const id = req.body._id;
    const user = await User.findOne({ _id: id});
    if (user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const phone = req.body.phoneNumber
    const checkUser = await User.findOne({phoneNumber});
    let userNumber = checkUser.phoneNumber;
    const config = {
      method: "post",
      url: `https://account.kudisms.net/api/?username=${EMAIL}&password=${PASSWORD}&message=${message}&sender=Bookie&mobiles=0${userNumber}`,
      headers: {},
    };
    const resp = await axios(config);
    console.log(resp.date);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error:error.message });
  }
};

// otp verification
exports.verifyPhoneOtp = async (req, res) => {
  try {
    const { otp, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      res.status(400).json({ message: "User not found" });
      return;
    }
    if (user.phoneOtp !== otp) {
      res.status(400).json({ message: "Incorrect otp error" });
      return;
    }
    const token = createJwtToken({ userId: user._id });

    user.phoneOtp = "";
    await user.save();

    return res.status(201).json({
      type: "success",
      message: "OTP verified successfully",
      data: {
        token,
        userId: user._id,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: error.message, message: "internal server error" });
  }
};

// user login

exports.loginWithPhone = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    // validate input
    if (!(phoneNumber || password)) {
      res.status(400).json("Invalid phone number or password");
      return;
    }
    // check if user exist
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      res.status(400).json({ message: "phone number not found" });
      return;
    }
    // check password
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      res.status(400).json({ message: "Wrong Password" });
      return;
    }
    // tokenize
    const token = createJwtToken({ userId: user._id });
    return res
      .status(200)
      .json({ message: "User logged in successfully", token });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: error.message, message: "internal server error" });
  }
};

// forgot password
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json("Invalid email");
      return;
    }
    const checkUser = await User.findOne({ email: req.body.email });
    if (!checkUser) {
      res.status(400).json("user not found");
      return;
    }
    const token = createJwtToken({ userId: checkUser._id });
    if (!token) {
      return res
        .status(500)
        .json({ message: "An error occurred,Please try again later" });
    }
    const resetLink = `http://localhost:5540/reset-password/${token}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_,
        pass: process.env.PASSWORD_,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_,
      to: email,
      subject: "Forgot password reset link",
      text: resetLink,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Email error application", error.message);
      } else {
        console.log(
          `${new Date().toLocaleString()} - Email sent successfully:` +
            info.response
        );
      }
    });
    await User.updateOne({ resetLink: token });
    res.send("Password reset link has been sent to ur mail");
    return;
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error);
  }
};

// reset password
exports.resetPassword = async (req, res) => {
  try {
    const { resetLink, newPass, email } = req.body;
    if (!(resetLink || newPass || email)) {
      return res.status(400).json({ message: "Invalid credential" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPass, salt);
    if (resetLink) {
      verifyJwtToken(resetLink, (err) => {
        if (err) {
          res.status(401).json({ error: "Incorrect token or it is expired" });
          return;
        }
        User.findOne({ resetLink }, (err, user) => {
          if (err || !user) {
            return res
              .status(400)
              .json({ error: "user with this token does not exist" });
          }

          const obj = {
            password: hashedPassword,
          };

          user = User.updateOne(user, obj);
          user.save((err) => {
            if (err) {
              return res.status(400).json({ error: "reset password error" });
            } else {
              return res.status(200).json({
                message: "your password has been changed successfully",
              });
            }
          });
        });
      });
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_,
          pass: process.env.PASSWORD_,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_,
        to: email,
        subject: ` Your Password has been updated `,
        html: `
    <h2> Here's your new password </h2>
    <p> new password: ${newPass}</p>
    `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        }
        console.log("Email Sent to " + info.accepted);
      });
    } else {
      return res.status(401).json({ error: "authentication error" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// update phone number
exports.updatePhone = async (req, res) => {
  try {
    const id = req.params.id;
    const { phoneNumber } = req.body;
    const user = User.findByIdAndUpdate(
      { _id: id },
      { phoneNumber },
      {
        new: true,
      }
    );
    res.status(200).json({ message: "Updated successfully", user });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.allUsers = async (req, res) => {
  try {
    const user = await User.find();
    return res.status(200).json({ message: "Registered Users", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.viewUser = async (req, res) => {
  try {
    const _id = req.params.userId;
    const user = await User.findOne({ userId: _id });
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
