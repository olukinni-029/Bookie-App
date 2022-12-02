const express = require("express");
const { uploadImage, viewBooks, viewByName } = require("../controller/bookImage");
const upload = require("../middleware/multer");
const checkAdmin = require ("../middleware/checkAdmin");

const router = express.Router();

router.post("/image", upload.single("bookImage"), uploadImage);
router.get('/books',viewBooks);
router.get('/:bookName',viewByName);
module.exports = router;
