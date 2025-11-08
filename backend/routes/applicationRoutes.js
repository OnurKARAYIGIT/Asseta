const express = require("express");
const router = express.Router();
const {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getInterviewsForApplication,
  getApplicationsByJobOpening, // Yeni controller fonksiyonunu import et
  makeOffer,
} = require("../controllers/applicationController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware"); // adminOrDeveloper burada kalabilir, kullanılmasa da zararı yok

router
  .route("/")
  .get(protect, getApplications)
  .post(protect, createApplication);

router
  .route("/:id")
  .get(protect, getApplicationById)
  .delete(protect, adminOrDeveloper, deleteApplication);

router
  .route("/:id/status")
  .put(protect, adminOrDeveloper, updateApplicationStatus);

router.route("/:appId/interviews").get(protect, getInterviewsForApplication);

// YENİ: Belirli bir iş ilanına ait başvuruları getiren rota
router.route("/job/:jobId").get(protect, getApplicationsByJobOpening);

// YENİ: Bir başvuruya teklif yapmak için rota
router.route("/:id/offer").post(protect, adminOrDeveloper, makeOffer);

module.exports = router;
