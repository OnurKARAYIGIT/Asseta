const express = require("express");
const router = express.Router();
const {
  getAuditLogs,
  getAuditLogUsers,
} = require("../controllers/auditLogController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

router.route("/").get(protect, adminOrDeveloper, getAuditLogs);
router.route("/users").get(protect, adminOrDeveloper, getAuditLogUsers);

module.exports = router;
