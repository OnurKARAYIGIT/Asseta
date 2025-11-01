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
      required: [true, "Varlık Tipi zorunludur."], // Excel: 02-Varlık Tipi
      index: true, // Varlık türüne göre gruplama sorgularını hızlandırmak için indeks ekliyoruz.
    },
    brand: {
      type: String, // Marka/Model alanı
      trim: true,
    },
    fixedAssetType: {
      type: String, // Sabit Kıymet Cinsi
      trim: true,
    },
    assetTag: {
      type: String, // Demirbaş No
      trim: true,
      unique: true,
      sparse: true,
    },
    assetSubType: {
      type: String, // Varlık Alt Kategori
      trim: true,
    },
    modelYear: {
      type: String, // Model Yılı
    },
    serialNumber: {
      type: String,
      unique: true,
      sparse: true, // Bu, null değerlerin unique kuralını ihlal etmesini engeller
    },
    networkInfo: {
      type: String, // Mac Adresi / IP Adres
    },
    softwareInfo: {
      type: String, // Kurulu Programlar, İşletim Sistemi vb.
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      default: "Boşta",
      enum: ["Boşta", "Zimmetli", "Arızalı", "Hurda", "Beklemede"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
