const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Kullanıcı adı zorunludur."],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "E-posta zorunludur."],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Telefon numarası zorunludur."],
    },
    position: {
      type: String,
      required: [true, "Pozisyon zorunludur."],
    },
    password: {
      type: String,
      required: [true, "Şifre zorunludur."],
    },
    role: {
      type: String,
      required: true,
      enum: [
        "user",
        "admin",
        "developer",
        "manager",
        "it_support",
        "accountant",
        "hr",
      ],
      default: "user",
    },
    permissions: {
      type: [String],
      default: [], // Varsayılan olarak boş, yani hiçbir özel yetkisi yok
    },
    lastLogin: {
      type: Date,
    },
    lastSeen: {
      type: Date,
    },
  },
  { timestamps: true } // createdAt ve updatedAt alanlarını otomatik ekler
);

module.exports = mongoose.model("User", userSchema);
