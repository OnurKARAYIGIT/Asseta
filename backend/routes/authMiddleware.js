const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel.js");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      res.status(401);
      if (error.name === "TokenExpiredError") {
        // Token süresi dolduysa, istemcinin token'ı yenilemesi gerektiğini belirt.
        throw new Error("Oturum süresi doldu, lütfen tekrar deneyin.");
      } else {
        throw new Error("Yetkilendirme başarısız, token geçersiz.");
      }
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Yetkisiz, token yok");
  }
});

const adminOrDeveloper = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "developer")
  ) {
    next();
  } else {
    res.status(403); // Forbidden
    throw new Error("Bu işleme yetkiniz yok.");
  }
};

module.exports = { protect, adminOrDeveloper };
