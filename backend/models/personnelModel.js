const mongoose = require("mongoose");

const personnelSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Personel adı ve soyadı zorunludur."],
      trim: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: [true, "Personel sicil numarası zorunludur."],
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    // Bu personel aynı zamanda bir kullanıcı ise, User modeline referans tutar.
    userAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      unique: true, // Her kullanıcı hesabı sadece bir personele ait olabilir.
      sparse: true, // null değerlerin yinelenmesine izin ver. Bu kritik!
    },
    isActive: {
      type: Boolean,
      default: true, // İşten ayrılanlar için false yapılabilir.
    },
  },
  {
    timestamps: true,
  }
);

const Personnel = mongoose.model("Personnel", personnelSchema);
module.exports = Personnel;
