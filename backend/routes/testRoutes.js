const express = require("express");
const router = express.Router();

// @desc    API'nin çalışıp çalışmadığını test eden ana rota
// @route   GET /
// @access  Public
router.get("/", (req, res) => {
  res.send("Zimmet Takip Sistemi API Çalışıyor!");
});

module.exports = router;
