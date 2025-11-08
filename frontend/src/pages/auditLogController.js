const asyncHandler = require("express-async-handler");
const AuditLog = require("../models/auditLogModel");

// @desc    Get all audit logs with filtering
// @route   GET /api/audit-logs
// @access  Private/Admin
const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, userId, personnelId } = req.query;

  const filter = {};

  if (userId) {
    filter["user._id"] = userId;
  }

  // YENİ: Personel ID'sine göre filtreleme mantığı
  if (personnelId) {
    filter.entityId = personnelId;
  }

  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await AuditLog.countDocuments(filter);
  res.json({ logs, total, page, pages: Math.ceil(total / limit) });
});

module.exports = { getAuditLogs };
