const asyncHandler = require("express-async-handler");
const Interview = require("../models/interviewModel");
const Application = require("../models/applicationModel");

// @desc    Yeni bir mülakat oluşturur
// @route   POST /api/interviews
// @access  Private/Admin
const createInterview = asyncHandler(async (req, res) => {
  const { application, interviewers, scheduledDate, interviewType } = req.body;

  if (!application || !interviewers || !scheduledDate || !interviewType) {
    res.status(400);
    throw new Error("Lütfen tüm zorunlu alanları doldurun.");
  }

  // Başvurunun varlığını kontrol et
  const applicationExists = await Application.findById(application);
  if (!applicationExists) {
    res.status(404);
    throw new Error("İlişkili başvuru bulunamadı.");
  }

  const interview = await Interview.create({
    application,
    interviewers,
    scheduledDate,
    interviewType,
    // Geri bildirim ve puanlama başlangıçta boş olacak
  });

  if (interview) {
    res.status(201).json(interview);
  } else {
    res.status(400);
    throw new Error("Geçersiz mülakat verisi.");
  }
});

// @desc    Bir mülakata geri bildirim ve puan ekler
// @route   PUT /api/interviews/:id/feedback
// @access  Private
const addFeedbackToInterview = asyncHandler(async (req, res) => {
  const { feedback, rating } = req.body;
  const interview = await Interview.findById(req.params.id);

  if (!interview) {
    res.status(404);
    throw new Error("Mülakat bulunamadı.");
  }

  // Sadece mülakatı yapan kişilerden biri veya admin geri bildirim ekleyebilir
  const isInterviewer = interview.interviewers.some((interviewerId) =>
    interviewerId.equals(req.user.personnel)
  );
  const isAdmin = req.user.role === "admin" || req.user.role === "developer";

  if (!isInterviewer && !isAdmin) {
    res.status(403);
    throw new Error("Bu mülakata geri bildirim ekleme yetkiniz yok.");
  }

  interview.feedback = feedback || interview.feedback;
  interview.rating = rating || interview.rating;

  const updatedInterview = await interview.save();
  res.json(updatedInterview);
});

// @desc    Bir mülakatı siler
// @route   DELETE /api/interviews/:id
// @access  Private/Admin
const deleteInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);

  if (interview) {
    await interview.deleteOne();
    res.json({ message: "Mülakat başarıyla silindi." });
  } else {
    res.status(404);
    throw new Error("Mülakat bulunamadı.");
  }
});

module.exports = {
  createInterview,
  addFeedbackToInterview,
  deleteInterview,
};
