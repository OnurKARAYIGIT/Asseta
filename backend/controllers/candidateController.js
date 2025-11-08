const asyncHandler = require("express-async-handler");
const Candidate = require("../models/candidateModel");

// @desc    Yeni bir aday oluşturur
// @route   POST /api/candidates
// @access  Private/Admin
const createCandidate = asyncHandler(async (req, res) => {
  const { fullName, email, phone, resumePaths, coverLetter, source, tags } =
    req.body;

  if (!fullName || !email) {
    res.status(400);
    throw new Error("Lütfen tüm zorunlu alanları doldurun.");
  }

  const candidateExists = await Candidate.findOne({ email });

  if (candidateExists) {
    res.status(400);
    throw new Error("Bu e-posta adresi zaten kayıtlı.");
  }

  const candidate = await Candidate.create({
    fullName,
    email,
    phone,
    resumePaths,
    coverLetter,
    source,
    tags,
  });

  if (candidate) {
    res.status(201).json({
      _id: candidate._id,
      fullName: candidate.fullName,
      email: candidate.email,
    });
  } else {
    res.status(400);
    throw new Error("Geçersiz aday verisi");
  }
});

// @desc    Tüm adayları listeler
// @route   GET /api/candidates
// @access  Private
const getCandidates = asyncHandler(async (req, res) => {
  // YENİ: Sorgu, artık sanal 'applications' alanını dolduracak.
  const candidates = await Candidate.find({})
    .populate({
      path: "applications", // Sanal alanımızın adı
      select: "jobOpening status",
      populate: {
        path: "jobOpening",
        select: "title", // Sadece iş ilanının başlığını getir
      },
    })
    .sort({ createdAt: -1 }); // En yeni adaylar en üstte
  res.json(candidates);
});

// @desc    ID ile tek bir adayı getirir
// @route   GET /api/candidates/:id
// @access  Private
const getCandidateById = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);

  if (candidate) {
    res.json(candidate);
  } else {
    res.status(404);
    throw new Error("Aday bulunamadı");
  }
});

// @desc    Bir adayı günceller
// @route   PUT /api/candidates/:id
// @access  Private/Admin
const updateCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);

  if (candidate) {
    candidate.fullName = req.body.fullName || candidate.fullName;
    candidate.email = req.body.email || candidate.email;
    candidate.phone = req.body.phone || candidate.phone;
    candidate.resumePaths = req.body.resumePaths ?? candidate.resumePaths; // YENİ: Belge yollarını güncelle
    candidate.coverLetter = req.body.coverLetter || candidate.coverLetter;
    candidate.source = req.body.source || candidate.source;
    candidate.tags = req.body.tags || candidate.tags;

    const updatedCandidate = await candidate.save();
    res.json({
      _id: updatedCandidate._id,
      fullName: updatedCandidate.fullName,
      email: updatedCandidate.email,
    });
  } else {
    res.status(404);
    throw new Error("Aday bulunamadı");
  }
});

// @desc    Bir adayı siler
// @route   DELETE /api/candidates/:id
// @access  Private/Admin
const deleteCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);

  if (candidate) {
    await candidate.deleteOne();
    res.json({ message: "Aday silindi" });
  } else {
    res.status(404);
    throw new Error("Aday bulunamadı");
  }
});

module.exports = {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
};
