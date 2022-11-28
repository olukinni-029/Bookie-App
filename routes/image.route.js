const express = require("express");
const { uploadImage, viewBooks } = require("../controller/bookImage");
const upload = require("../middleware/multer");
const checkAdmin = require ("../middleware/checkAdmin");

const router = express.Router();

router.post("/image", upload.single("bookImage"), uploadImage);
router.get('/books',viewBooks);
module.exports = router;
