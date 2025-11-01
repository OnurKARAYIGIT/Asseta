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
  printAssignmentForm, // printAssignmentForm'u import et
  returnAssignment,
  returnMultipleAssignments,
  printReturnReceipt,
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
  .route("/return-multiple")
  .put(protect, adminOrDeveloper, returnMultipleAssignments);

// Tek bir zimmet üzerinde işlem yapmak için rotalar
router
  .route("/:id")
  .get(protect, getAssignmentById)
  .put(protect, adminOrDeveloper, updateAssignment)
  .delete(protect, adminOrDeveloper, deleteAssignment);

// Zimmet iade etmek için yeni rota
router.route("/:id/return").put(protect, adminOrDeveloper, returnAssignment);

router.route("/:id/print").get(protect, printAssignmentForm);

// İade tutanağı yazdırmak için yeni rota
router.route("/return-receipts/:id/print").get(protect, printReturnReceipt);

module.exports = router;
