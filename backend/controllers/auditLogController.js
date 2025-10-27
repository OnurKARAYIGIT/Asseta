const asyncHandler = require("express-async-handler");
const AuditLog = require("../models/auditLogModel");
const User = require("../models/userModel");

// @desc    Tüm denetim kayıtlarını getirir
// @route   GET /api/audit-logs
// @access  Private/Admin
const getAuditLogs = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 15;
  const page = Number(req.query.page) || 1;
  const { userId, startDate, endDate } = req.query;
  const filter = {};

  if (userId) {
    filter.user = userId;
  }

  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)), // Bitiş tarihinin sonunu dahil et
    };
  }

  const count = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter)
    .populate("user", "username")
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    logs,
    page,
    pages: Math.ceil(count / pageSize),
  });
});

const getAuditLogUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("username").sort("username");
  res.json(users);
});

module.exports = { getAuditLogs, getAuditLogUsers };
