const mongoose = require("mongoose");

const payrollPeriodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    status: {
      type: String,
      required: true,
      enum: ["Açık", "İşleniyor", "Kilitli"], // Open, Processing, Locked
      default: "Açık",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location", // Şirketler Location modelinde tutuluyor
      required: [true, "Bordro dönemi bir şirketle ilişkilendirilmelidir."],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PayrollPeriod", payrollPeriodSchema);
