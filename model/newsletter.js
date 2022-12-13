const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:[true,'please enter a valid email'],
        trim:true,
    },
    first_name:{
        type:String,
        trim:true,
        required:true,
    },
    last_name:{
        type:String,
        trim:true,
        required:true,
    },
},
{
timestamps:true,
versionKey:false,
}
);

module.exports = mongoose.model('Newsletter',newsletterSchema);