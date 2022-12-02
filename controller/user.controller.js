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
    res.status(201).json({
      message: "OTP  sent successfully",
      user,
      userId: user._id,
    });
    // Generate Otp, save and send to the user
    let userNumber = user.phoneNumber;
    const config = {
      method: "post",
      url: `https://account.kudisms.net/api/?username=${EMAIL}&password=${PASSWORD}&message=${message}&sender=Bookie&mobiles=${userNumber}`,
      headers: {},
    };
    // fetch the kudisms 
    const resp = await axios(config);

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
      subject: "Verification otp",
      text: message,
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error:error.message });
  }
};

// resend otp
exports.resendOtp = async (req, res,next) => {
  try {
    const user = await User.findOne({id:req.params.userId});
    // check if user exist
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    // Save new generated otp
    user.phoneOtp = OTP;
    await user.save();

    // Using kudisms to send the otp to user phone
    let userNumber = user.phoneNumber;
    const config = {
      method: "post",
     url: `https://account.kudisms.net/api/?username=${EMAIL}&password=${PASSWORD}&message=${message}&sender=Bookie&mobiles=${userNumber}`,
     headers: {},
    };
    const resp = await axios(config);
    
    // Send otp to user using nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_,
        pass: process.env.PASSWORD_,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_,
      to: user.email,
      subject: "Verification otp",
      text: message,
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

      res.status(201).json({message:"Your OTP is successfully sent",user});
       return;
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error:error.message });
  }
};

// otp verification
exports.verifyPhoneOtp = async (req, res) => {
  try {
    // Validate input
    const { otp, userId } = req.body;
    // check if user exist
    const user = await User.findById(userId);
    if (!user) {
      res.status(400).json({ message: "User not found" });
      return;
    }
    // check if otp passed equal to the one generated during signup
    if (user.phoneOtp !== otp) {
      res.status(400).json({ message: "Incorrect otp error" });
      return;
    }
    // Create token
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
    // Validate input
    if (!email) {
      res.status(400).json("Invalid email");
      return;
    }
    // Check if user exist
    const checkUser = await User.findOne({ email: req.body.email });
    if (!checkUser) {
      res.status(400).json("user not found");
      return;
    }
    // Generate token and resetLink
    const token = createJwtToken({ userId: checkUser._id });
    if (!token) {
      return res
        .status(500)
        .json({ message: "An error occurred,Please try again later" });
    }
    const resetLink = `http://localhost:5540/reset-password/${token}`;
    
    // Send resetLink using nodemailer
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
    // Save resetLink
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
    // Validate all input
    const { resetLink, newPass, email } = req.body;
    if (!(resetLink || newPass || email)) {
      return res.status(400).json({ message: "Invalid credential" });
    }
    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPass, salt);
    
    // check  and verify resetLink
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
          
          // Update and Save new Password
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
      
      // Send new Password to mail using nodemailer
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

// Admin view all user
exports.allUsers = async (req, res) => {
  try {
    const user = await User.find();
    return res.status(200).json({ message: "Registered Users", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// User view  dashboard
exports.viewUser = async (req, res) => {
  try {
    const user = await User.findOne({id:req.params.userId},{password:0});
    return res.status(200).json(user);
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
