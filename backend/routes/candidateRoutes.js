const express = require("express");
const router = express.Router();
const {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
} = require("../controllers/candidateController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(protect, getCandidates)
  .post(protect, adminOrDeveloper, createCandidate);

router
  .route("/:id")
  .get(protect, getCandidateById)
  .put(protect, adminOrDeveloper, updateCandidate)
  .delete(protect, adminOrDeveloper, deleteCandidate);

module.exports = router;
