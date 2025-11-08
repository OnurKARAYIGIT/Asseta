const asyncHandler = require("express-async-handler");
const AuditLog = require("../models/auditLogModel");

// @desc    Get all audit logs with filtering and pagination
// @route   GET /api/audit-logs
// @access  Private/Admin
const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 25,
    userId,
    personnelId,
    startDate,
    endDate,
  } = req.query;
  let filter = {};

  // Frontend'den gelen userId filtresini uygula
  if (personnelId) {
    filter["user"] = userId;
  }

  // Personel detay sayfasından gelen personnelId filtresini uygula
  if (personnelId) {
    filter.entityId = personnelId;
  }

  // Tarih aralığı filtresini uygula
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const count = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter)
    .populate("user", "username") // Kullanıcı adını da getir
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((page - 1) * parseInt(limit));

  res.json({ logs, total: count, page, pages: Math.ceil(count / limit) });
});

module.exports = { getAuditLogs };
