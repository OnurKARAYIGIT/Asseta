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

// Tek bir zimmet üzerinde işlem yapmak için rotalar
router
  .route("/:id")
  .get(protect, getAssignmentById)
  .put(protect, adminOrDeveloper, updateAssignment)
  .delete(protect, adminOrDeveloper, deleteAssignment);

module.exports = router;
