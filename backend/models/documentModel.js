const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    personnel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Personnel",
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: ["CV", "Kimlik", "Diploma", "Sözleşme", "Sağlık Raporu", "Diğer"],
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
