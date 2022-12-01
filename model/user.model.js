const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:[true,'please enter a valid email'],
    },
    phoneNumber:{
        type:String,
        required:true,
        unique:[true,'please enter a valid phone number'],
    },
    password:{
        type:String,
        required:[true,'please enter a valid password'],
        alphanumeric:true,
    },
    school:{
        type:String,
    },
    phoneOtp: {
        type: String,
        expires: '3m',
      },
      role :{
        type : String,
       },
       resetLink:{
        type:String,
        default:""
      },
},
{
timestamps:true,
versionKey:false,
}
);

module.exports = mongoose.model('User',userSchema);