const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    personnel: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Personnel",
    },
    leaveType: {
      type: String,
      required: true,
      enum: ["Yıllık İzin", "Hastalık", "Mazeret", "Doğum", "Diğer"],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Beklemede", "Onaylandı", "Reddedildi"],
      default: "Beklemede",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Leave", leaveSchema);
