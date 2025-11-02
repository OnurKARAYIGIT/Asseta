const mongoose = require("mongoose");

const salaryComponentSchema = new mongoose.Schema(
  {
    personnel: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Personnel",
    },
    name: {
      type: String,
      required: [true, "Bileşen adı zorunludur."],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Kazanç", "Kesinti"], // Earning or Deduction
    },
    amount: {
      type: Number,
      required: [true, "Tutar zorunludur."],
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalaryComponent", salaryComponentSchema);
