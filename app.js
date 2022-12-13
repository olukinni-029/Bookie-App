require("dotenv").config();
const express = require("express");
const connectDB = require("./database/db");
const userRoute = require("./routes/user.route");
const cors = require("cors");
const imageRoute = require("./routes/image.route");
const newsLetter = require("./routes/newsletter.route");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
      credentials: true,
      origin: "*",
      optionsSuccessStatus: 200,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    })
  );
  

connectDB();
const port = process.env.PORT|| 1080;

app.use('/api/user',userRoute);
app.use('/api',imageRoute);
app.use('/api/newsletter',newsLetter);


app.get('/',(req,res)=>{
res.send('Homepage');
});


app.listen(port,()=>{
    console.log(`Server listening on http://localhost:${port}`);
});
