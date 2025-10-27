const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken.js");
const Assignment = require("../models/assignmentModel");
const logAction = require("../utils/auditLogger");
const AuditLog = require("../models/auditLogModel");

// @desc    Yeni bir kullanıcı kaydı oluşturur
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  // Doğrulama artık middleware tarafından yapıldığı için, req.body'yi güvenle kullanabiliriz.
  const { username, email, password, phone, position, role } = req.body;

  const existingUser = await User.findOne({
    $or: [{ username: username }, { email: email }],
  });

  if (existingUser) {
    if (existingUser.username === username) {
      res.status(400);
      throw new Error("Bu kullanıcı adı zaten mevcut.");
    }
    if (existingUser.email === email) {
      res.status(400);
      throw new Error("Bu e-posta adresi zaten kullanılıyor.");
    }
  }

  // Şifreyi hash'le
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // User.create'e doğrulanmış 'value' nesnesini ve hash'lenmiş şifreyi gönder
  const user = await User.create({ ...req.body, password: hashedPassword });

  if (user) {
    await logAction(
      user, // Logu oluşturan kullanıcı (kendisi)
      "KULLANICI_KAYDI",
      `'${user.username}' adıyla yeni bir kullanıcı hesabı oluşturuldu.`
    );
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      position: user.position,
      role: user.role,
      permissions: user.permissions,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Geçersiz kullanıcı verisi.");
  }
});

// @desc    Kullanıcı girişi yapar ve token döner
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (user && (await bcrypt.compare(password, user.password))) {
    // Son giriş ve görülme zamanını güncelle
    user.lastLogin = new Date();
    user.lastSeen = new Date();
    await user.save();

    await logAction(
      user, // Logu oluşturan kullanıcı (kendisi)
      "KULLANICI_GİRİŞİ",
      `'${user.username}' kullanıcısı sisteme giriş yaptı.`
    );

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      position: user.position,
      role: user.role,
      permissions: user.permissions,
      token: generateToken(user._id),
    });
  } else {
    res.status(401); // Unauthorized
    throw new Error("Geçersiz kullanıcı adı veya şifre.");
  }
});

// @desc    Kullanıcı profilini ve zimmetlerini getirir
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const assignments = await Assignment.find({ personnelName: user.username })
      .populate("item", "name brand serialNumber assetTag")
      .populate("company", "name")
      .sort({ assignmentDate: -1 });

    // Kullanıcının tüm işlem geçmişini bul
    const actions = await AuditLog.find({ user: user._id }).sort({
      createdAt: -1,
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      position: user.position,
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
      user,
      "KENDİ_ŞİFRESİNİ_GÜNCELLEDİ",
      "Kullanıcı kendi şifresini güncelledi."
    );
    res.json({ message: "Şifre başarıyla güncellendi." });
  } else {
    res.status(401);
    throw new Error("Mevcut şifre yanlış.");
  }
});

// @desc    Tüm kullanıcıları getirir
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  // Kullanıcıları ve her birinin son denetim kaydını getirmek için aggregation kullanıyoruz.
  const users = await User.aggregate([
    {
      $lookup: {
        from: "auditlogs", // Denetim kayıtlarının collection adı
        localField: "_id",
        foreignField: "user",
        as: "actions",
      },
    },
    {
      $addFields: {
        // actions dizisinin son elemanını (en son eylemi) al
        lastAction: { $arrayElemAt: ["$actions", -1] },
      },
    },
    {
      // Şifre ve tüm aksiyon listesi gibi gereksiz alanları sonuçtan çıkar
      $project: {
        password: 0,
        actions: 0,
      },
    },
    { $sort: { createdAt: -1 } }, // Kullanıcıları en yeniden eskiye sırala
  ]);

  res.json(users);
});

// @desc    Bir kullanıcıyı siler
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    await logAction(
      req.user,
      "KULLANICI_SİLİNDİ",
      `'${user.username}' kullanıcısı silindi.`
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
  const user = await User.findById(req.params.id);
  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.position = req.body.position || user.position;
    user.role = req.body.role || user.role;

    user.permissions = req.body.permissions ?? user.permissions;
    await logAction(
      req.user,
      "KULLANICI_GÜNCELLENDİ",
      `'${user.username}' kullanıcısının rolü '${user.role}' olarak güncellendi.`
    );
    const updatedUser = await user.save();
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

  const user = await User.findById(req.params.id);

  if (user) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    await logAction(
      req.user,
      "ŞİFRE_SIFIRLANDI",
      `'${user.username}' kullanıcısının şifresi sıfırlandı.`
    );
    res.json({
      message: `${user.username} kullanıcısının şifresi başarıyla sıfırlandı.`,
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

  // İsimle eşleşen ilk kullanıcıyı bul
  const user = await User.findOne({
    username: { $regex: `^${name}$`, $options: "i" },
  }).select("-password"); // Şifreyi gönderme

  if (user) {
    res.json(user);
  } else {
    // Kullanıcı bulunamazsa hata yerine null döndür, bu bir hata durumu değil.
    res.json(null);
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserPassword,
  getAllUsers,
  deleteUser,
  updateUserByAdmin,
  resetUserPassword,
  getUserProfileByName,
};
