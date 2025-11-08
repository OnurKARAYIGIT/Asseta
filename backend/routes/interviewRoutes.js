const express = require("express");
const router = express.Router();
const {
  createInterview,
  addFeedbackToInterview,
  deleteInterview,
} = require("../controllers/interviewController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

router.route("/").post(protect, adminOrDeveloper, createInterview);

router.route("/:id").delete(protect, adminOrDeveloper, deleteInterview);

router.route("/:id/feedback").put(protect, addFeedbackToInterview);

module.exports = router;
