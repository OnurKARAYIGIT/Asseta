const mongoose = require("mongoose");

const jobOpeningSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Pozisyon başlığı zorunludur."],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Departman zorunludur."],
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location", // Şirketler Location modelinde tutuluyor
      required: [true, "İş ilanı bir şirketle ilişkilendirilmelidir."],
    },
    description: {
      type: String,
      required: [true, "İş tanımı zorunludur."],
    },
    requirements: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Açık", "Dolduruldu", "İptal Edildi"],
      default: "Açık",
    },
    hiringManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Personnel",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobOpening", jobOpeningSchema);
