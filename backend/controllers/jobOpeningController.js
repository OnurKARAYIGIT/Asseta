const asyncHandler = require("express-async-handler");
const JobOpening = require("../models/jobOpeningModel");

// @desc    Yeni bir iş ilanı oluşturur
// @route   POST /api/job-openings
// @access  Private/Admin
const createJobOpening = asyncHandler(async (req, res) => {
  const { title, department, company, description, requirements } = req.body;

  if (!title || !department || !company || !description) {
    res.status(400);
    throw new Error("Lütfen tüm zorunlu alanları doldurun.");
  }

  const jobOpening = await JobOpening.create({
    title,
    department,
    company,
    description,
    requirements,
    hiringManager: req.user.personnel, // DÜZELTME: req.user._id yerine req.user.personnel kullanılmalı
  });

  if (jobOpening) {
    res.status(201).json({
      _id: jobOpening._id,
      title: jobOpening.title,
      department: jobOpening.department,
      company: jobOpening.company,
      status: jobOpening.status,
    });
  } else {
    res.status(400);
    throw new Error("Geçersiz iş ilanı verisi");
  }
});

// @desc    Tüm iş ilanlarını listeler
// @route   GET /api/job-openings
// @access  Private
const getJobOpenings = asyncHandler(async (req, res) => {
  const jobOpenings = await JobOpening.find({}).populate("company", "name"); // Şirket adını getir
  res.json(jobOpenings);
});

// @desc    ID ile tek bir iş ilanını getirir
// @route   GET /api/job-openings/:id
// @access  Private
const getJobOpeningById = asyncHandler(async (req, res) => {
  const jobOpening = await JobOpening.findById(req.params.id).populate(
    "company",
    "name"
  );

  if (jobOpening) {
    res.json(jobOpening);
  } else {
    res.status(404);
    throw new Error("İş ilanı bulunamadı");
  }
});

// @desc    Bir iş ilanını günceller
// @route   PUT /api/job-openings/:id
// @access  Private/Admin
const updateJobOpening = asyncHandler(async (req, res) => {
  const jobOpening = await JobOpening.findById(req.params.id);

  if (jobOpening) {
    jobOpening.title = req.body.title || jobOpening.title;
    jobOpening.department = req.body.department || jobOpening.department;
    jobOpening.company = req.body.company || jobOpening.company;
    jobOpening.description = req.body.description || jobOpening.description;
    jobOpening.requirements = req.body.requirements || jobOpening.requirements;
    jobOpening.status = req.body.status || jobOpening.status;

    const updatedJobOpening = await jobOpening.save();
    res.json({
      _id: updatedJobOpening._id,
      title: updatedJobOpening.title,
      department: updatedJobOpening.department,
      company: updatedJobOpening.company,
      status: updatedJobOpening.status,
    });
  } else {
    res.status(404);
    throw new Error("İş ilanı bulunamadı");
  }
});

// @desc    Bir iş ilanını siler
// @route   DELETE /api/job-openings/:id
// @access  Private/Admin
const deleteJobOpening = asyncHandler(async (req, res) => {
  const jobOpening = await JobOpening.findById(req.params.id);

  if (jobOpening) {
    await jobOpening.deleteOne();
    res.json({ message: "İş ilanı silindi" });
  } else {
    res.status(404);
    throw new Error("İş ilanı bulunamadı");
  }
});

module.exports = {
  createJobOpening,
  getJobOpenings,
  getJobOpeningById,
  updateJobOpening,
  deleteJobOpening,
};
