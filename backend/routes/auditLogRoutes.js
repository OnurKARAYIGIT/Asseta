const express = require("express");
const router = express.Router();
const { getAuditLogs } = require("../controllers/auditLogController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

// Bu rota artık hem tüm logları hem de personele göre filtrelenmiş logları getirecek
router.route("/").get(protect, adminOrDeveloper, getAuditLogs);

module.exports = router;
