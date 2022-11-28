const otpGenerator = require("otp-generator");

const OTP = otpGenerator.generate(4,{
    upperCaseAlphabets: false,
  specialChars: false,
});

const message = `${OTP}`;


module.exports = {OTP,message};