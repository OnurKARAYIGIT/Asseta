const express = require("express");
const router = express.Router();
const {
  createCompany,
  getCompanies,
} = require("../controllers/companyController");
const { protect, admin } = require("../middleware/authMiddleware");

router
  .route("/")
  .post(protect, admin, createCompany)
  .get(protect, getCompanies);

module.exports = router;
