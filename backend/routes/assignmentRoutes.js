const express = require("express");
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  getAssignmentsByPersonnel,
  getAssignmentById,
  getPendingGroupedAssignments, // Yeni fonksiyonu import et
  updateAssignment,
  deleteAssignment,
  approveMultipleAssignments, // Yeni
  rejectMultipleAssignments, // Yeni
  printAssignmentForm, // printAssignmentForm'u import et
  returnAssignment,
  returnMultipleAssignments, // Bu fonksiyon import edilmemişti.
  printReturnReceipt,
  printBatchAssignmentForm,
} = require("../controllers/assignmentController");
const {
  protect,
  adminOrDeveloper,
} = require("../middleware/authMiddleware.js");

router
  .route("/")
  .post(protect, adminOrDeveloper, createAssignment)
  .get(protect, getAssignments);

// Personele göre arama için yeni rota
router.route("/search").get(protect, getAssignmentsByPersonnel);

// Bekleyen zimmetleri gruplanmış getirmek için yeni rota
router.route("/pending-grouped").get(protect, getPendingGroupedAssignments);

// Toplu zimmet iadesi için yeni rota
router
  .route("/approve-multiple")
  .put(protect, adminOrDeveloper, approveMultipleAssignments);

router
  .route("/reject-multiple")
  .post(protect, adminOrDeveloper, rejectMultipleAssignments);

// Tek bir zimmet üzerinde işlem yapmak için rotalar
router
  .route("/:id")
  .get(protect, getAssignmentById)
  .put(protect, adminOrDeveloper, updateAssignment)
  .delete(protect, adminOrDeveloper, deleteAssignment);

// Zimmet iade etmek için yeni rota
router.route("/:id/return").put(protect, adminOrDeveloper, returnAssignment);

router.route("/:id/print").get(protect, printAssignmentForm);
router.route("/print-batch").post(protect, printBatchAssignmentForm);
// router.route("/return-multiple").post(protect, returnMultipleAssignments);

// İade tutanağı yazdırmak için yeni rota
router.route("/return-receipts/:id/print").get(protect, printReturnReceipt);

module.exports = router;
