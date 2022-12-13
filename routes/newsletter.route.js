const express = require("express");
const checkAdmin = require("../middleware/checkAdmin");
const { Subscribe } = require("../controller/letter.controller");
const router = express.Router();

router.post("/signup",Subscribe);

module.exports = router;