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
} = require("../controller/user.controller");
const checkAuth = require("../middleware/checkAuth");
const router = express.Router();

router.post("/signup", userSignup);
router.post("/otp", verifyPhoneOtp);
router.post("/login", loginWithPhone);
router.post("/forgotPass", forgetPassword);
router.put("/resetpassword", resetPassword);
router.put("/update/:id",updatePhone);
router.get("/users",allUsers);
router.get("/user/:_id",checkAuth,viewUser);

module.exports = router;
