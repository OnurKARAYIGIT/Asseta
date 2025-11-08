const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Adayın adı ve soyadı zorunludur."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Adayın e-posta adresi zorunludur."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    resumePaths: {
      type: [String], // Yüklenen belgelerin yolları (dizi olarak)
      default: [],
    },
    coverLetter: {
      type: String,
    },
    source: {
      type: String, // Başvuru kaynağı (LinkedIn, Kariyer.net vb.)
    },
    tags: {
      type: [String], // Adayla ilgili etiketler (React, Senior, Node.js vb.)
    },
  },
  { timestamps: true }
);

// YENİ: Sanal (Virtual) populate için alan tanımlaması
// Bu, Candidate şemasında bir "applications" alanı olmamasına rağmen,
// Application modelindeki kayıtları bu aday ile ilişkilendirmemizi sağlar.
candidateSchema.virtual("applications", {
  ref: "Application", // Hangi model ile ilişki kurulacak
  localField: "_id", // Candidate modelindeki hangi alan (bu adayın ID'si)
  foreignField: "candidate", // Application modelindeki hangi alan (başvurudaki aday alanı)
});

// Sanal alanların JSON çıktısına dahil edilmesini sağla
candidateSchema.set("toJSON", { virtuals: true });
candidateSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Candidate", candidateSchema);
