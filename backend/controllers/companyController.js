const asyncHandler = require("express-async-handler");
const Company = require("../models/companyModel");

// @desc    Yeni bir şirket oluşturur
// @route   POST /api/companies
// @access  Private/Admin
const createCompany = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Şirket adı zorunludur.");
  }

  const company = new Company({
    name,
  });

  const createdCompany = await company.save();
  res.status(201).json(createdCompany);
});

// @desc    Tüm şirketleri listeler
// @route   GET /api/companies
// @access  Private
const getCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({});
  res.json(companies);
});

module.exports = {
  createCompany,
  getCompanies,
};
