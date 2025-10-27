const asyncHandler = require("express-async-handler");
const User = require("../models/userModel.js");

/**
 * @description 'developer' rolündeki kullanıcılar üzerinde belirli işlemlerin yapılmasını kısıtlayan middleware.
 * Sadece başka bir 'developer' bu kullanıcıları güncelleyebilir veya şifrelerini sıfırlayabilir.
 * 'developer' rolündeki kullanıcılar silinemez.
 */
const protectDeveloper = asyncHandler(async (req, res, next) => {
  // İşlem yapılacak kullanıcıyı ID'sinden bul
  const targetUser = await User.findById(req.params.id);

  if (targetUser && targetUser.role === "developer") {
    const requester = req.user;

    // Silme işlemi ise her zaman engelle
    if (req.method === "DELETE") {
      res.status(403); // Forbidden
      throw new Error("Developer rolündeki kullanıcılar silinemez.");
    }

    // Güncelleme veya şifre sıfırlama işlemi ise, sadece başka bir developer yapabilir
    if (req.method === "PUT" && requester.role !== "developer") {
      res.status(403); // Forbidden
      throw new Error(
        "Developer rolündeki kullanıcıları sadece başka bir developer güncelleyebilir."
      );
    }
  }

  next();
});

module.exports = { protectDeveloper };
