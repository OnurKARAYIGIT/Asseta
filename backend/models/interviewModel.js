const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    interviewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Personnel",
        required: true,
      },
    ],
    scheduledDate: {
      type: Date,
      required: true,
    },
    interviewType: {
      type: String,
      enum: ["Telefon", "İK Mülakatı", "Teknik Mülakat", "Yönetici Mülakatı"],
      required: true,
    },
    feedback: {
      type: String,
    },
    rating: {
      type: Number, // 1-5 arası puanlama
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
