const mongoose = require("mongoose");

const changeSchema = new mongoose.Schema({
  field: String,
  from: mongoose.Schema.Types.Mixed,
  to: mongoose.Schema.Types.Mixed,
});

const historySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  username: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  changes: [changeSchema],
});

const assignmentSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Item",
    },
    // YENİ YAPI: Artık 'personnelName' yerine 'Personnel' modeline referans kullanacağız.
    personnel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Personnel",
      required: true,
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Location",
      index: true,
    },
    unit: { type: String, required: true },
    location: { type: String },
    registeredSection: { type: String },
    assignmentDate: { type: Date, default: Date.now },
    returnDate: { type: Date },
    status: {
      type: String,
      enum: ["Zimmetli", "İade Edildi", "Arızalı", "Hurda", "Beklemede"],
      default: "Beklemede",
      index: true,
    },
    assignmentNotes: { type: String },
    formPath: { type: String },
    history: [historySchema],
  },
  {
    timestamps: true,
  }
);

// Sorgu performansını artırmak için indeks ekliyoruz.
assignmentSchema.index({ item: 1, createdAt: -1 });

module.exports = mongoose.model("Assignment", assignmentSchema);
