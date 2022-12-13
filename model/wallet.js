const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    walletId: {
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
        maxLength:11,
      },
      balance: {
        type: mongoose.Decimal128,
        required: true,
        default: 0.00
    },
    contactAddress:{
      type:String,
      required:true,
    },
    accountNum:{
      type:String,
    },
    is_permanent:{
      type:String,
      default:true,
    },
    tx_ref:{
      type:String,
    },
},
{
    timestamps:true,
    versionKey:false,
}
);

module.exports = mongoose.model('Wallet',walletSchema);