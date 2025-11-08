const express = require("express");
const router = express.Router();
const {
  createJobOpening,
  getJobOpenings,
  getJobOpeningById,
  updateJobOpening,
  deleteJobOpening,
} = require("../controllers/jobOpeningController.js"); // Dosya adı düzeltildi
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(protect, getJobOpenings)
  .post(protect, adminOrDeveloper, createJobOpening);

router
  .route("/:id")
  .get(protect, getJobOpeningById)
  .put(protect, adminOrDeveloper, updateJobOpening)
  .delete(protect, adminOrDeveloper, deleteJobOpening);

module.exports = router;
