const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    personnel: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Personnel",
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
    },
    workDuration: {
      // Dakika cinsinden çalışma süresi
      type: Number,
    },
    overtime: {
      // Dakika cinsinden fazla mesai süresi
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Çalışıyor", "Tamamlandı"],
      default: "Çalışıyor",
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AttendanceRecord", attendanceRecordSchema);
