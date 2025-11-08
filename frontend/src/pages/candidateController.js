const asyncHandler = require("express-async-handler");
const Candidate = require("../models/candidateModel");

// @desc    Tüm adayları getirir
// @route   GET /api/candidates
// @access  Private
const getCandidates = asyncHandler(async (req, res) => {
  const candidates = await Candidate.find({}).populate({
    path: "applications",
    select: "jobOpening status",
    populate: {
      path: "jobOpening",
      select: "title",
    },
  });
  res.json(candidates);
});

// @desc    Yeni bir aday oluşturur
// @route   POST /api/candidates
// @access  Private
const createCandidate = asyncHandler(async (req, res) => {
  const { fullName, email, phone, source, resumePaths, tags } = req.body;

  if (!fullName || !email) {
    res.status(400);
    throw new Error("Ad Soyad ve E-posta alanları zorunludur.");
  }

  const candidate = await Candidate.create({
    fullName,
    email,
    phone,
    source,
    resumePaths,
    tags,
  });

  res.status(201).json(candidate);
});

// @desc    Bir adayı günceller
// @route   PUT /api/candidates/:id
// @access  Private
const updateCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);

  if (!candidate) {
    res.status(404);
    throw new Error("Aday bulunamadı.");
  }

  const updatedCandidate = await Candidate.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updatedCandidate);
});

// @desc    Bir adayı siler
// @route   DELETE /api/candidates/:id
// @access  Private
const deleteCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);

  if (candidate) {
    // TODO: Adaya ait başvuruları da silmek gerekebilir.
    await candidate.deleteOne();
    res.json({ message: "Aday silindi." });
  } else {
    res.status(404);
    throw new Error("Aday bulunamadı.");
  }
});

module.exports = {
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
};
