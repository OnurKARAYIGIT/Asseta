const express = require("express");
const router = express.Router();
const {
  createCompany,
  getCompanies,
} = require("../controllers/companyController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

router
  .route("/")
  .post(protect, adminOrDeveloper, createCompany)
  .get(protect, getCompanies);

module.exports = router;
