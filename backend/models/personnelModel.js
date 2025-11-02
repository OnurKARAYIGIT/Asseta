const mongoose = require("mongoose");

const personnelSchema = new mongoose.Schema(
  {
    // --- Mevcut Alanlar ---
    fullName: {
      type: String,
      required: [true, "Personel adı ve soyadı zorunludur."],
      trim: true,
    },
    employeeId: {
      type: String,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Şirket İlişkisi (Çoklu firma desteği için)
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location", // Şirketler Location modelinde tutuluyor
      required: [true, "Personel bir şirketle ilişkilendirilmelidir."],
    },

    // --- 1. ADIM: YENİ EKLENEN İK ALANLARI ---

    // Kişisel Bilgiler
    personalInfo: {
      tcNo: { type: String, trim: true },
      birthDate: { type: Date },
      gender: { type: String, enum: ["Erkek", "Kadın", "Belirtilmemiş"] },
    },

    // İletişim ve Adres Bilgileri
    contactInfo: {
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
    },

    // İş Bilgileri
    jobInfo: {
      department: { type: String, trim: true },
      position: { type: String, trim: true },
      employmentType: {
        type: String,
        enum: ["Tam Zamanlı", "Yarı Zamanlı", "Stajyer", "Danışman"],
        default: "Tam Zamanlı",
      },
      startDate: { type: Date, required: true, default: Date.now },
      endDate: { type: Date }, // İşten ayrılma tarihi
    },

    // Sigorta ve Sözleşme Bilgileri
    insuranceInfo: {
      sgkNo: { type: String, trim: true },
      contractType: {
        type: String,
        enum: ["Belirli Süreli", "Belirsiz Süreli"],
      },
      contractEndDate: { type: Date },
    },

    // Maaş Bilgileri
    salaryInfo: {
      grossSalary: { type: Number, default: 0 },
      currency: { type: String, default: "TRY" },
    },

    // Organizasyon Şeması İlişkisi
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Personnel",
    },

    // Yüklenen Evraklar (Yeni Document Modeline Referans)
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Personnel", personnelSchema);
