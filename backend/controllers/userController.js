const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken"); // Bu satırı ekleyin
const Personnel = require("../models/personnelModel"); // Personnel modelini import et
const generateToken = require("../utils/generateToken.js");
const Assignment = require("../models/assignmentModel");
const logAction = require("../utils/auditLogger");
const AuditLog = require("../models/auditLogModel");

// @desc    Yeni bir kullanıcı kaydı oluşturur
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  // YENİ YAPI: Kullanıcı oluşturmak için önce bir personel ID'si gerekir.
  const { personnelId, username, email, password, role, permissions } =
    req.body;

  const personnel = await Personnel.findById(personnelId);
  if (!personnel) {
    res.status(404);
    throw new Error("Kullanıcı oluşturulacak personel bulunamadı.");
  }

  if (personnel.userAccount) {
    res.status(400);
    throw new Error("Bu personelin zaten bir kullanıcı hesabı var.");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Bu e-posta adresi zaten kullanılıyor.");
  }

  // Şifre hash'leme işlemi artık userModel'deki pre-save hook'u tarafından yapılıyor.
  const user = await User.create({
    personnel: personnelId,
    username, // username'i de ekliyoruz
    email,
    password, // Şifreyi olduğu gibi gönderiyoruz
    role,
    permissions,
  });

  if (user) {
    // Personel kaydını da güncelle
    personnel.userAccount = user._id;
    await personnel.save();

    await logAction(
      req, // IP adresi için req nesnesini ekle
      "KULLANICI_KAYDI",
      `'${personnel.fullName}' personeli için yeni bir kullanıcı hesabı oluşturuldu.`
    );
    // loginUser'daki gibi tam bir kullanıcı objesi döndür
    loginUser(req, res);
  } else {
    res.status(400);
    throw new Error("Geçersiz kullanıcı verisi.");
  }
});

// @desc    Kullanıcı token'larını yeniler
// @route   POST /api/users/refresh-token
// @access  Public (via Refresh Token)
const refreshToken = asyncHandler(async (req, res) => {
  // Hem cookie'den hem de body'den gelen token'ı kontrol et
  const refreshToken = req.cookies.refreshToken || req.body.token;
  if (!refreshToken) {
    res.status(401);
    throw new Error("Yetkilendirme başarısız, yenileme token'ı bulunamadı.");
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const newAccessToken = generateToken(decoded.id, "60m");

    // Yeni access token'ı hem cookie'ye yaz hem de response olarak dön
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 60 dakika
    });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401);
    throw new Error("Geçersiz refresh token.");
  }
});

// @desc    Kullanıcı girişi yapar ve token döner
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  // Artık sicil numarası (username) ile giriş yapılıyor
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username }).populate(
      "personnel",
      "fullName position department"
    );
    if (user && (await user.matchPassword(password))) {
      // Bu satır doğru, kontrol amaçlı bırakıldı.
      // Son giriş ve görülme zamanını güncelle
      user.lastLogin = new Date();
      user.lastSeen = new Date();
      await user.save();

      // Loglama fonksiyonunun doğru kullanıcıyı bulabilmesi için req.user'ı manuel olarak ayarla
      req.user = user;

      await logAction(
        req, // IP adresi için req nesnesini ekle
        "KULLANICI_GİRİŞİ",
        // Artık personel ismini kullanıyoruz
        `'${user.personnel.fullName}' kullanıcısı sisteme giriş yaptı.`
      );

      // Token'ları httpOnly cookie olarak ayarla
      res.cookie("accessToken", generateToken(user._id, "1h"), {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
      });
      res.cookie("refreshToken", generateToken(user._id, "7d"), {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        _id: user._id,
        personnel: user.personnel, // username, position vb. bilgiler burada
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        // Token'ları localStorage için de gönder
        accessToken: generateToken(user._id, "60m"),
        refreshToken: generateToken(user._id, "7d"),
      });
    } else {
      res.status(401); // Unauthorized
      throw new Error("Geçersiz sicil numarası veya şifre.");
    }
  } catch (error) {
    // Hata durumunda 500 koduyla birlikte daha açıklayıcı bir mesaj gönderelim.
    res.status(500);
    throw new Error(`Giriş işlemi sırasında bir hata oluştu: ${error.message}`);
  }
});

// @desc    Kullanıcı çıkışı yapar ve cookie'leri temizler
// @route   POST /api/users/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  // Cookie'leri temizle
  res.cookie("accessToken", "", { httpOnly: true, expires: new Date(0) });
  res.cookie("refreshToken", "", { httpOnly: true, expires: new Date(0) });

  res.status(200).json({ message: "Çıkış başarılı." });
});

// @desc    Kullanıcı profilini ve zimmetlerini getirir
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "personnel",
    "fullName position department"
  );

  if (user) {
    // Artık personnel ID'si ile arama yapıyoruz
    const assignments = await Assignment.find({ personnel: user.personnel._id })
      .populate("item", "name brand serialNumber assetTag")
      .populate("company", "name")
      .sort({ assignmentDate: -1 });

    // Kullanıcının tüm işlem geçmişini bul
    const actions = await AuditLog.find({ "user._id": user._id }).sort({
      createdAt: -1,
    });

    res.json({
      _id: user._id,
      personnel: user.personnel,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      assignments: assignments,
      actions: actions, // lastAction yerine tüm actions'ı gönder
    });
  } else {
    res.status(404);
    throw new Error("Kullanıcı bulunamadı.");
  }
});

// @desc    Kullanıcı şifresini günceller
// @route   PUT /api/users/profile/password
// @access  Private
const updateUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error("Lütfen tüm alanları doldurun.");
  }

  const user = await User.findById(req.user._id);

  if (user && (await bcrypt.compare(oldPassword, user.password))) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    await logAction(
      req, // IP adresi için req nesnesini ekle
      "KENDİ_ŞİFRESİNİ_GÜNCELLEDİ",
      "Kullanıcı kendi şifresini güncelledi."
    );
    res.json({ message: "Şifre başarıyla güncellendi." });
  } else {
    res.status(401);
    throw new Error("Mevcut şifre yanlış.");
  }
});

// @desc    Get user settings
// @route   GET /api/users/settings
// @access  Private
const getUserSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("settings");
  if (user) {
    // Eğer kullanıcının ayarları henüz yoksa, varsayılan ayarları döndür
    res.json(user.settings || {});
  } else {
    res.status(404);
    throw new Error("Kullanıcı bulunamadı.");
  }
});

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
const updateUserSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Gelen yeni ayarları, mevcut ayarların üzerine yazmak yerine onlarla birleştir.
    // Bu, sadece değiştirilen ayarların güncellenmesini sağlar.
    const currentSettings = user.settings ? user.settings.toObject() : {};
    const newSettings = {
      ...currentSettings,
      ...req.body,
      visibleColumns: {
        ...currentSettings.visibleColumns,
        ...req.body.visibleColumns,
      },
    };
    user.settings = newSettings;
    // Mongoose'a 'settings' alanının değiştirildiğini bildir.
    user.markModified("settings");
    await user.save({ validateBeforeSave: false }); // Şema doğrulamalarını atla
    // Loglama eklenebilir
    res.json(user.settings);
  } else {
    res.status(404);
    throw new Error("Kullanıcı bulunamadı.");
  }
});

// @desc    Tüm kullanıcıları getirir
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  // YENİ YAPI: Kullanıcıları personel bilgileriyle birlikte getir.
  // Eski karmaşık aggregation yerine populate kullanmak daha temiz ve verimli.
  const users = await User.find({})
    .populate({
      path: "personnel",
      select: "fullName employeeId department position", // İhtiyaç duyulan alanları seç
    })
    .select("-password") // Şifreyi gönderme
    .sort({ createdAt: -1 });

  res.json(users);
});

// @desc    Bir kullanıcıyı siler
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  // Silinecek kullanıcının personel bilgilerini de alalım
  const user = await User.findById(req.params.id).populate(
    "personnel",
    "fullName"
  );
  if (user) {
    await logAction(
      req.user,
      "KULLANICI_SİLİNDİ",
      `'${user.personnel?.fullName || user.email}' kullanıcısı silindi.`
    );
    await user.deleteOne();
    res.json({ message: "Kullanıcı başarıyla silindi." });
  } else {
    res.status(404);
    throw new Error("Kullanıcı bulunamadı.");
  }
});

// @desc    Bir kullanıcının bilgilerini (rol vb.) günceller
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUserByAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate(
    "personnel",
    "fullName"
  );
  if (user) {
    // Kullanıcıya ait rol ve izinler güncellenir
    user.role = req.body.role || user.role;
    user.permissions = req.body.permissions ?? user.permissions;

    // Personel bilgileri (isim, departman vb.) Personnel koleksiyonundan güncellenmelidir.
    // Bu endpoint şimdilik sadece kullanıcıya özel alanları güncellesin.
    user.email = req.body.email || user.email;

    const updatedUser = await user.save();

    await logAction(
      req.user,
      "KULLANICI_GÜNCELLENDİ",
      `'${
        user.personnel?.fullName || updatedUser.email
      }' kullanıcısının bilgileri güncellendi.`
    );

    // Güncellenmiş kullanıcıyı personel bilgileriyle birlikte döndür
    await updatedUser.populate("personnel", "fullName position department");

    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error("Kullanıcı bulunamadı.");
  }
});

// @desc    Admin tarafından bir kullanıcının şifresini sıfırlar
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    res.status(400);
    throw new Error("Lütfen yeni şifreyi girin.");
  }

  const user = await User.findById(req.params.id).populate(
    "personnel",
    "fullName"
  );

  if (user) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    await logAction(
      req.user,
      "ŞİFRE_SIFIRLANDI",
      `'${
        user.personnel?.fullName || user.email
      }' kullanıcısının şifresi sıfırlandı.`
    );
    res.json({
      message: `${
        user.personnel?.fullName || user.email
      } kullanıcısının şifresi başarıyla sıfırlandı.`,
    });
  } else {
    res.status(404);
    throw new Error("Kullanıcı bulunamadı.");
  }
});

// @desc    İsme göre kullanıcı profili getirir
// @route   GET /api/users/by-name
// @access  Private
const getUserProfileByName = asyncHandler(async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ message: "Personel adı gerekli." });
  }

  // Artık isme göre personel arayıp, personelin userAccount'u üzerinden kullanıcıyı buluyoruz.
  const personnel = await Personnel.findOne({
    fullName: { $regex: `^${name}$`, $options: "i" },
  });

  if (!personnel || !personnel.userAccount) return res.json(null);
  const user = await User.findById(personnel.userAccount).select("-password");

  if (user) {
    res.json(user);
  } else {
    // Kullanıcı bulunamazsa hata yerine null döndür, bu bir hata durumu değil.
    res.json(null);
  }
});

module.exports = {
  registerUser,
  refreshToken,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserPassword,
  getAllUsers,
  deleteUser,
  updateUserByAdmin,
  resetUserPassword,
  getUserProfileByName,
  getUserSettings,
  updateUserSettings,
};
