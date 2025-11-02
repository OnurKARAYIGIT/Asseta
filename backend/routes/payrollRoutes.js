const express = require("express");
const router = express.Router();
const {
  getPayrollPeriods,
  createPayrollPeriod,
  getPayrollPeriodById,
  generatePayrollsForPeriod,
  getPayrollRecord,
  printPayrollRecord,
  exportBankListCsv,
  getMyPayrollRecords,
} = require("../controllers/payrollController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

router
  .route("/periods")
  .get(protect, adminOrDeveloper, getPayrollPeriods)
  .post(protect, adminOrDeveloper, createPayrollPeriod);

router
  .route("/periods/:id")
  .get(protect, adminOrDeveloper, getPayrollPeriodById);

router
  .route("/periods/:id/generate")
  .post(protect, adminOrDeveloper, generatePayrollsForPeriod);

// Bu rota, parametreli rotalardan önce gelmeli ki çakışmasın.
router.route("/my-records").get(protect, getMyPayrollRecords);

router.route("/records/find").get(protect, adminOrDeveloper, getPayrollRecord);

router.route("/records/:id/print").get(protect, printPayrollRecord); // Hem admin hem kullanıcı erişebilmeli

router
  .route("/periods/:id/export-csv")
  .get(protect, adminOrDeveloper, exportBankListCsv);

module.exports = router;
