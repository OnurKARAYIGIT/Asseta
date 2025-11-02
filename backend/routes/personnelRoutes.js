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

router.route("/list").get(protect, adminOrDeveloper, getPersonnelList);
router.route("/").post(protect, adminOrDeveloper, createPersonnel);
router.route("/for-selection").get(protect, getPersonnelForSelection);

router
  .route("/:id")
  .get(protect, getPersonnelById)
  .put(protect, adminOrDeveloper, updatePersonnel);

router
  .route("/:id/salary")
  .put(protect, adminOrDeveloper, updatePersonnelSalary);

// Maaş Bileşenleri Rotaları
router
  .route("/:id/components")
  .get(protect, adminOrDeveloper, getSalaryComponents)
  .post(protect, adminOrDeveloper, addSalaryComponent);
router
  .route("/:id/components/:componentId")
  .delete(protect, adminOrDeveloper, deleteSalaryComponent);

module.exports = router;
