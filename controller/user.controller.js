const User = require("../model/user.model");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { createJwtToken, verifyJwtToken } = require("../middleware/token");
const { OTP, message } = require("../utils/message");
const nodemailer = require("nodemailer");
let { PASSWORD, EMAIL } = process.env;
const Wallet = require("../model/wallet");


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
    const user = await User.findOne({email });
    if (!user) {
      res.status(400).json("User doesn't Exist");
      return;
    }
    // Generate token and resetLink
    const token = createJwtToken({ userId: user._id });
    if (!token) {
      return res                            
        .status(500)
        .json({ message: "An error occurred,Please try again later" });
    }
    const resetLink = `http://localhost:5540/reset-password/${token}`;
    
    // Send resetLink using nodemailer
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port:465,
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
    user.Token = token
    await user.save();
    res.status(200).json({message:"Your Password Reset link has been sent to your mail"});
    return;
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error);
  }
};

// To get the reset link
exports.resetLink = async (req, res) => {
  const Token = req.params.Token
  const user = await User.findOne({ Token })
  res.status(201).json( { 
    Token,
    valid: user ? true : false
  });
};

// reset password
exports.resetPassword = async (req, res) => {
  try {
    // Validate all input
    const {newPass} = req.body;
    if (!(newPass)) {
      return res.status(400).json({ message: "Invalid credential" });
    }
const token  = req.params.token;

    const user = await User.findOne({Token:token });
    if (!user) return res.status(400).send("invalid link or expired");


    // hash password
    let salt = await bcrypt.genSalt(10);

    const hash = await bcrypt.hash(newPass, salt);

    user.password = hash;
     user.Token = "";
    await user.save();


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

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Admin view all user
exports.allUsers = async (req, res) => {
  try {n
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

// create a user wallet
exports.createWallet = async(req,res)=>{
  try {
    const {firstName,lastName,bvn,contactAddress}= req.body;
    if(!(firstName||lastName||bvn||contactAddress)){
      res.status(400).json({message:"All field are required"});
    }
    const checkUser = await User.findOne({userId});
    if(!checkUser){
      res.status(400).json("Unauthorized");
    };
    const wallet = await Wallet .create({
      firstName,
      lastName,
      bvn,
      contactAddress,
    })
  } catch (error) {
    
  }
}
