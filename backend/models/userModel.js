const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Artık ana kimlik 'personnel' referansı olacak.
    personnel: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Personnel",
      unique: true,
    },
    username: {
      type: String,
      required: [true, "Kullanıcı adı (sicil no) zorunludur."],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "E-posta zorunludur."],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Şifre zorunludur."],
    },
    role: {
      type: String,
      required: true,
      enum: ["user", "admin", "developer"],
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
    settings: {
      type: Object,
      default: {}, // Varsayılan olarak boş bir obje
    },
  },
  { timestamps: true } // createdAt ve updatedAt alanlarını otomatik ekler
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

module.exports = User;
