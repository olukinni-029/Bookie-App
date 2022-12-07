const express = require("express");
const {
  userSignup,
  forgetPassword,
  resetPassword,
  verifyPhoneOtp,
  loginWithPhone,
  updatePhone,
  allUsers,
  viewUser,
  resendOtp,
  resetLink,
} = require("../controller/user.controller");
const checkAuth = require("../middleware/checkAuth");
const checkAdmin = require("../middleware/checkAdmin");
const router = express.Router();

router.post("/signup", userSignup);
router.post("/resendOtp/:id",resendOtp);
router.post("/otp", verifyPhoneOtp);
router.post("/login", loginWithPhone);
router.post("/forgotPass", forgetPassword);
router.post("/resetpassword", resetPassword);
router.get("/reset-password/:token",resetLink);
router.get("/users",checkAdmin,allUsers);
router.get("/:id",checkAuth,viewUser);
router.put("/update/:id",checkAuth,updatePhone);

module.exports = router;
