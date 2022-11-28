require("dotenv").config();
const express = require("express");
const connectDB = require("./database/db");
const userRoute = require("./routes/user.route");
const cors = require("cors");
const imageRoute = require("./routes/image.route");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
      credentials: true,
      origin: "*",
      optionsSuccessStatus: 200,
    })
  );
  

connectDB();
const port = process.env.PORT|| 1080;

app.use('/api/user',userRoute);
app.use('/api',imageRoute);


app.get('/',(req,res)=>{
res.send('Homepage');
});


app.listen(port,()=>{
    console.log(`Server listening on http://localhost:${port}`);
});
