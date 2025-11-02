const asyncHandler = require("express-async-handler");
const Document = require("../models/documentModel.js");
const Personnel = require("../models/personnelModel.js");
const logAction = require("../utils/auditLogger");
const fs = require("fs");
const path = require("path");

// @desc    Personele ait bir evrak yükler
// @route   POST /api/personnel/:id/documents
// @access  Private/Admin (HR yetkisi eklenebilir)
const uploadDocument = asyncHandler(async (req, res) => {
  const { documentType } = req.body;
  const personnelId = req.params.id;

  if (!req.file) {
    res.status(400);
    throw new Error("Lütfen bir dosya seçin.");
  }

  if (!documentType) {
    res.status(400);
    throw new Error("Evrak tipi zorunludur.");
  }

  const personnel = await Personnel.findById(personnelId);
  if (!personnel) {
    res.status(404);
    throw new Error("Personel bulunamadı.");
  }

  const newDocument = await Document.create({
    personnel: personnelId,
    documentType,
    fileName: req.file.originalname,
    filePath: req.file.path,
  });

  // Döküman ID'sini personel kaydına ekle
  personnel.documents.push(newDocument._id);
  await personnel.save();

  await logAction(
    req.user,
    "PERSONEL_EVRAK_YUKLENDI",
    `'${personnel.fullName}' personeli için '${documentType}' tipinde bir evrak yüklendi.`
  );

  res.status(201).json(newDocument);
});

// @desc    Personele ait tüm evrakları listeler
// @route   GET /api/personnel/:id/documents
// @access  Private
const getPersonnelDocuments = asyncHandler(async (req, res) => {
  const personnelId = req.params.id;
  const documents = await Document.find({ personnel: personnelId }).sort({
    createdAt: -1,
  });
  res.json(documents);
});

// @desc    Bir evrağı siler
// @route   DELETE /api/documents/:docId
// @access  Private/Admin (HR yetkisi eklenebilir)
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.docId).populate(
    "personnel",
    "fullName"
  );

  if (!document) {
    res.status(404);
    throw new Error("Evrak bulunamadı.");
  }

  // Fiziksel dosyayı sil
  if (fs.existsSync(document.filePath)) {
    fs.unlinkSync(document.filePath);
  }

  // Personel kaydından referansı kaldır
  await Personnel.findByIdAndUpdate(document.personnel._id, {
    $pull: { documents: document._id },
  });

  await document.deleteOne();

  await logAction(
    req.user,
    "PERSONEL_EVRAK_SILINDI",
    `'${document.personnel.fullName}' personeline ait '${document.fileName}' adlı evrak silindi.`
  );

  res.json({ message: "Evrak başarıyla silindi." });
});

module.exports = {
  uploadDocument,
  getPersonnelDocuments,
  deleteDocument,
};
