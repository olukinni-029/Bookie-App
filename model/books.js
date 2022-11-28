const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
    bookName:{
      type:String,
      required:true,
    },
    bookImage: {
        type: String,
        required: [true, 'please enter a valid image'],
        default:
          '',
      },
      bookPublisher:{
        type:String,
        required:true,
      },   
      price:{
        type: Number,
        required: true,
      },
      categories:{
        type:String,
        enum:["juniorSec","seniorSec"],
        default:""
      },
      juniorSec:{
        type: Number,
        enum:[1,2,3],
      },
      seniorSec:{
        type: Number,
        enum:[1,2,3],
      },
},
{
    timestamps:true,
    versionKey:false,
}
);

module.exports = mongoose.model('Image',imageSchema);