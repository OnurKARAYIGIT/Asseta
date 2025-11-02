const express = require("express");
const router = express.Router();
const {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveStatus,
  printLeaveForm,
} = require("../controllers/leaveController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

// Kişisel izin işlemleri (Tüm giriş yapmış kullanıcılar)
router.route("/").post(protect, createLeaveRequest);
router.route("/my-leaves").get(protect, getMyLeaveRequests);
router.route("/print-form").post(protect, printLeaveForm); // İzin formu yazdırma rotası

// Yönetimsel izin işlemleri (Sadece Admin/Developer)
router.route("/").get(protect, adminOrDeveloper, getAllLeaveRequests);
router.route("/:id/status").put(protect, adminOrDeveloper, updateLeaveStatus);

module.exports = router;
