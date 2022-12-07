const mongoose = require("mongoose");


const tranxSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      trnxType: {
        type: String,
        required: true,
        enum: ['CR', 'DR']
      },
      purpose:{
        type: String,
        enum : ['deposit', 'transfer', 'reversal', 'withdrawal'],
        required: true
      },
      amount: {
        type: mongoose.Decimal128,
        required: true,
        default: 0.00
      },
      reference: {
         type: String, 
         required: true 
        },
      balanceBefore: {
        type: mongoose.Decimal128,
        required: true,
      },
      balanceAfter: {
        type: mongoose.Decimal128,
        required: true,
      },
      summary: { type: String, required: true },
      trnxSummary:{ type: String, required: true }

},
{timestamps:true,
    versionKey:false}
);

module.exports = mongoose.model("Transaction",tranxSchema);