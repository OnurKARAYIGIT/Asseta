const express = require("express");
const router = express.Router();
const {
  getAttendanceRecords,
  getMyAttendanceStatus,
  clockIn,
  clockOut,
} = require("../controllers/attendanceController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

// Bu rota, personele göre filtrelenmiş mesai kayıtlarını getirecek
router.route("/").get(protect, adminOrDeveloper, getAttendanceRecords);

// YENİ EKLENEN ROTALAR
router.route("/status").get(protect, getMyAttendanceStatus);
router.route("/clock-in").post(protect, clockIn);
router.route("/clock-out").post(protect, clockOut);

module.exports = router;
