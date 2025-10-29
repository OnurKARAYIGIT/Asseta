const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Token'ı header'dan al (Bearer kelimesini ayır)
      token = req.headers.authorization.split(" ")[1];

      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Kullanıcıyı ID ile bul ve şifre olmadan req objesine ekle
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Yetkili değil, token başarısız");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Yetkili değil, token bulunamadı");
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
