const mongoose = require("mongoose");

// YENİ: Teklif detaylarını tutacak alt şema
const offerSchema = new mongoose.Schema({
  offeredSalary: { type: Number, required: true },
  currency: { type: String, enum: ["TRY", "USD", "EUR"], default: "TRY" },
  startDate: { type: Date, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ["Beklemede", "Kabul Edildi", "Reddedildi"],
    default: "Beklemede",
  },
  offerDate: { type: Date, default: Date.now },
});

// YENİ: Başvuru durum geçmişini tutacak alt şema
const applicationHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: "changedAt" } } // `changedAt` alanını otomatik oluştur
);

const applicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    jobOpening: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobOpening",
      required: true,
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        "Başvuru Alındı",
        "Ön Değerlendirme",
        "İK Mülakatı",
        "Teknik Mülakat",
        "Teklif",
        "İşe Alındı",
        "Reddedildi",
      ],
      default: "Başvuru Alındı",
    },
    // YENİ: Teklif detaylarını saklamak için
    offer: offerSchema,
    history: [applicationHistorySchema],
  },
  { timestamps: true }
);

// Bir adayın aynı ilana birden fazla kez başvurmasını engelle
applicationSchema.index({ candidate: 1, jobOpening: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
