const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:[true,'please enter a valid email'],
        trim:true,
    },

},
{
timestamps:true,
versionKey:false,
}
);

module.exports = mongoose.model('Newsletter',newsletterSchema);