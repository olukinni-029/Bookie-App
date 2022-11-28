const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      firstName:{
        type:String,
        maxLength:10,
        minLength:5,
        required:true,
    },
    lastName:{
        type:String,
        maxLength:10,
        minLength:5,
        required:true,
    },
      bvn:{
        type:String,
        required: true,
      },
      balance: {
        type: mongoose.Decimal128,
        required: true,
        default: 0.00
    },
    contactAddress:{
      type:String,
    },
},
{
    timestamps:true,
    versionKey:false,
}
)

module.exports = mongoose.model('Wallet',walletSchema);