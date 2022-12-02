const User = require("../model/user.model");
const { verifyJwtToken } = require("./token");

module.exports = async (req, res, next) => {
  try {
    // check for auth header from client
    const header = req.headers.authorization;

    if (!header) {
      next({ status: 403, message: "auth header is missing" });
      return;
    }

    // verify  auth token
    const token = header.split("Bearer ")[1];

    if (!token) {
      next({ status: 403, message: "auth token is missing" });
      return;
    }
    // verify the userId with the token
    const userId = verifyJwtToken(token, next);

    if (!userId) {
      next({ status: 403, message: "incorrect token" });
      return;
    }
    // check for the user if exist
    const user = await User.findById(userId);

    if (!user) {
      next({ status: 404, message: "User not found" });
      return;
    }

    res.locals.user = user;

    next();
  } catch (err) {
    next(err);
  }
};
