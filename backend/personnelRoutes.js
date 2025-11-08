const express = require("express");
const router = express.Router();
const {
  getPersonnelList,
  createPersonnel,
  updatePersonnel,
  getPersonnelById,
  getPersonnelForSelection,
  updatePersonnelSalary,
  getSalaryComponents,
  addSalaryComponent,
  deleteSalaryComponent,
} = require("../controllers/personnelController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

// Personel listesini getiren rota. Artık tüm yetkili kullanıcılar (user dahil) erişebilir.
router.route("/list").get(protect, getPersonnelList);

// Sadece admin/developer yetkisine sahip kullanıcıların erişebileceği rotalar
router.route("/").post(protect, adminOrDeveloper, createPersonnel);

router
  .route("/:id")
  .get(protect, getPersonnelById) // Detay görmeye herkesin yetkisi olabilir, bu yüzden 'protect' yeterli.
  .put(protect, adminOrDeveloper, updatePersonnel);

router
  .route("/:id/salary")
  .put(protect, adminOrDeveloper, updatePersonnelSalary);

router
  .route("/:id/components")
  .get(protect, adminOrDeveloper, getSalaryComponents)
  .post(protect, adminOrDeveloper, addSalaryComponent);

router
  .route("/:id/components/:componentId")
  .delete(protect, adminOrDeveloper, deleteSalaryComponent);

// Seçim listeleri için tüm yetkili kullanıcıların erişebileceği rota
router.route("/for-selection").get(protect, getPersonnelForSelection);

module.exports = router;
