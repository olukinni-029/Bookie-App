const Image = require("../model/books");
const cloudinary = require("../utils/cloudinary");

 exports.uploadImage = async (req,res)=>{
    try {
        const {bookName,bookImage,bookPublisher,price,categories,juniorSec,seniorSec}= req.body;
       if(!(bookName||bookImage||bookPublisher,price,categories)){
           res.status(400).json("All field required");
           return;
       }
       const isExisting = await Image.findOne({bookName});
       if (isExisting) {
           return res.status(409).json({
               message: 'Image Already existing'
            });
        }
        const result = await cloudinary.uploader.upload(req.file.path);
       const image = await Image.create({
           bookName,
          bookImage:result.secure_url,
          bookPublisher,
          categories,
          price,
          juniorSec,
          seniorSec,
       });
        res.status(200).json({message:"Image successfully uploaded",image});
        return;
   } catch (error) {
    console.log(error);
        res.status(500).json({message:error.message});
    }
};

exports.viewBooks = async (req,res)=>{
    try {
        const image = await Image.find({}, { _id: 0, createdAt: 0,updatedAt:0 });
        return res.status(200).json({image});
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

exports.viewByName = async (req,res)=>{
    try {
        const image = await Image.find({bookName:req.params.bookName});
        return res.status(200).json({image});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
};