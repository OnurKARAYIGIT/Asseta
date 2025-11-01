const asyncHandler = require("express-async-handler");
const Personnel = require("../models/personnelModel");

// @desc    Get all personnel for selection
// @route   GET /api/personnel
// @access  Private
const getAllPersonnel = asyncHandler(async (req, res) => {
  // Arama ve filtreleme için query parametrelerini al
  const keyword = req.query.keyword
    ? {
        fullName: {
          $regex: req.query.keyword,
          $options: "i",
        },
      }
    : {};

  // Sadece aktif personelleri getir ve sadece gerekli alanları seç
  const personnel = await Personnel.find({ ...keyword, isActive: true })
    .select("fullName employeeId email") // email alanını da seç
    .sort({ fullName: 1 }); // Isme göre sırala

  res.json(personnel);
});

module.exports = { getAllPersonnel };
