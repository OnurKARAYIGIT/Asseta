const express = require("express");
const router = express.Router();
const {
  createLocation,
  getLocations,
} = require("../controllers/locationController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

router
  .route("/")
  .post(protect, adminOrDeveloper, createLocation)
  .get(protect, getLocations);

module.exports = router;
