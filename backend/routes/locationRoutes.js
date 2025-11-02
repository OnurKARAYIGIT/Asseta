const express = require("express");
const router = express.Router();
const {
  createLocation,
  getLocations,
  getLocationsForSelection,
  updateLocation,
  deleteLocation,
} = require("../controllers/locationController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

router
  .route("/")
  .post(protect, adminOrDeveloper, createLocation)
  .get(protect, getLocations);

router.route("/for-selection").get(protect, getLocationsForSelection);

module.exports = router;
