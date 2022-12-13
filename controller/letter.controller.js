const Newsletter = require("../model/newsletter");
const nodemailer = require("nodemailer");


exports.Subscribe = async(req,res)=>{
    try {
        const {email,first_name,last_name}= req.body;
        if(!(email||first_name||last_name)){
            res.status(400).json({message:"Input a valid email"});
            return;
        }
        // check if the email is subscribed with
        const checkSub = await Newsletter.findOne({email});
        if(checkSub){
            res.status(404).json({message:"This email already subscribe"});
            return;
        }

        const newsletter = await Newsletter.create({
            email,
            first_name,
            last_name,
        });
        
        // Send otp to user using nodemailer
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        auth: {
          user: process.env.EMAIL_,
          pass: process.env.PASSWORD_,
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_,
        to: email,
        subject: "Newsletter",
        html:`<h1>Hello ${first_name}</h1>
        <p>Thank You For Subscribing to Bookie Newsletter<br><br>
        Here you get to know about the latest on Books and Stationaries available</p>`
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Email error application", error.message);
        } else {
          console.log(
            `${new Date().toLocaleString()} - Email sent successfully:` +
              info.response
          );
        }
      });
      
      res.status(200).json({ message:"You successfully subscribed to our newsletter",newsletter});
      return;
    } catch (error) {
        console.log(error);
        res.status(400).json({ message:error.message});
    }
};