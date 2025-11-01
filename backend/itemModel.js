const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Eşya adı zorunludur."],
      trim: true,
    },
    assetType: {
      type: String,
      required: [true, "Varlık tipi zorunludur."],
    },
    assetSubType: {
      type: String,
    },
    brand: {
      type: String,
    },
    fixedAssetType: {
      type: String,
    },
    assetTag: {
      type: String,
      unique: true,
      // Demirbaş numarası her zaman dolu olacağı için sparse'a gerek yok.
      // Eğer boş olabilseydi, buraya da sparse: true eklenirdi.
    },
    modelYear: {
      type: Number,
    },
    serialNumber: {
      type: String,
      unique: true,
      sparse: true, // ÇÖZÜM: Bu satır, null değerlerin unique kuralını ihlal etmesini engeller.
    },
    networkInfo: {
      type: String,
    },
    softwareInfo: {
      type: String,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      default: "Boşta",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Item", itemSchema);
