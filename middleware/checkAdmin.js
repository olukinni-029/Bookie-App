const User = require("../model/user.model");
const { verifyJwtToken } = require("./token");

module.exports = async (req, res, next) => {
    try {
      const header = req.headers.authorization;

    if (!header) {
      next({ status: 403, message: "auth header is missing" });
      return;
    }
      const token = header.split("Bearer ")[1];

      if (!token) {
        next({ status: 403, message: "auth token is missing" });
        return;
      }
  
      const userId = verifyJwtToken(token, next);
  
      if (!userId) {
        next({ status: 403, message: "incorrect token" });
        return;
      }
  
      const user = await User.findById(userId);
  
      if (!user) {
        next({ status: 404, message: "User not found" });
        return;
      }
  
     res.locals.user = user;
      
      if (user.role !=="Admin") {
        return res.status(401).json({ message: "Access deny for normal user" });
      }
    
      if (user.role === "Admin") {
        return next();
      }
    } catch (error) {
      console.log(error);
    };
  };
  