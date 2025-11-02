const mongoose = require("mongoose");

const payrollRecordSchema = new mongoose.Schema(
  {
    payrollPeriod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayrollPeriod",
      required: true,
    },
    personnel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Personnel",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location", // Assuming you are using the Location model for companies
      required: true,
    },
    status: {
      type: String,
      enum: ["Hesaplanmadı", "Hesaplandı", "Ödendi", "Hatalı"],
      default: "Hesaplanmadı",
    },
    // Kazançlar
    grossSalary: { type: Number, default: 0 },
    earnings: [
      {
        name: String,
        amount: Number,
      },
    ],
    totalEarnings: { type: Number, default: 0 }, // Brüt Maaş + Kazançlar

    // Kesintiler
    deductions: [
      {
        name: String,
        amount: Number,
      },
    ],
    totalDeductions: { type: Number, default: 0 }, // Personel tarafından eklenen kesintiler

    // Yasal Kesintiler
    sgkWorkerShare: { type: Number, default: 0 }, // %14
    unemploymentWorkerShare: { type: Number, default: 0 }, // %1
    incomeTaxBase: { type: Number, default: 0 },
    incomeTax: { type: Number, default: 0 },
    stampDuty: { type: Number, default: 0 },
    totalLegalDeductions: { type: Number, default: 0 },

    // Sonuç
    netSalary: { type: Number, default: 0 },
    currency: { type: String, default: "TRY" },
  },
  { timestamps: true }
);

// Bir dönem içinde bir personel için sadece bir bordro olabilir.
payrollRecordSchema.index({ payrollPeriod: 1, personnel: 1 }, { unique: true });

module.exports = mongoose.model("PayrollRecord", payrollRecordSchema);
