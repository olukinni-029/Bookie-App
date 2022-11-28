module.exports = (req, res, next) => {
    const currentUser = res.locals.user;
  
    if (!currentUser) {
      return next({ status: 401, message: "Access deny for normal user" });
    }
  
    if (currentUser.role === "admin") {
      return next();
    }
  
    return next({ status: 401, message: "Access deny for normal user" });
  };
  