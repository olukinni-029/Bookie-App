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
  createWallet,
} = require("../controller/user.controller");
const checkAuth = require("../middleware/checkAuth");
const checkAdmin = require("../middleware/checkAdmin");
const router = express.Router();

router.post("/signup", userSignup);
router.post("/resendOtp/:id", resendOtp);
router.post("/otp", verifyPhoneOtp);
router.post("/login", loginWithPhone);
router.post("/forgotPass", forgetPassword);
router.post("/resetpassword/:token", resetPassword);
router.get("/users", checkAdmin, allUsers);
router.get("/:id", checkAuth, viewUser);
router.put("/update/:id", checkAuth, updatePhone);
router.post("/create",checkAuth,createWallet);

module.exports = router;
