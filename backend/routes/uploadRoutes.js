const path = require("path");
const express = require("express");
const multer = require("multer");
const router = express.Router();
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/"); // Yükleme hedefini 'uploads/' olarak düzeltiyoruz.
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Sadece resim (jpg, jpeg, png) veya PDF dosyaları yüklenebilir!");
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// @route   POST /api/upload
// @desc    Upload a file
// @access  Private
router.post(
  "/",
  protect,
  adminOrDeveloper,
  upload.single("form"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).send({ message: "Lütfen bir dosya seçin." });
    }
    res.send({
      message: "Dosya başarıyla yüklendi",
      // Sunucudan dönen dosya yolunu doğrudan /uploads/ ile başlayan bir URL'e çeviriyoruz.
      filePath: `/uploads/${req.file.filename}`,
    });
  }
);

module.exports = router;
