const asyncHandler = require("express-async-handler");
const AuditLog = require("../models/auditLogModel");
const User = require("../models/userModel");
const Personnel = require("../models/personnelModel"); // Personnel modelini import et

// @desc    Tüm denetim kayıtlarını getirir
// @route   GET /api/audit-logs
// @access  Private/Admin
const getAuditLogs = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 15; // limit query'sini de destekle
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
    .populate({
      path: "user", // user alanını populate et
      select: "personnel", // user'dan sadece personnel'i seç
      populate: {
        // iç içe populate
        path: "personnel", // user.personnel alanını populate et
        select: "fullName", // personnel'den sadece fullName'i seç
      },
    })
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
  // Artık kullanıcıları personel bilgileriyle birlikte gönderiyoruz
  const users = await User.find({ personnel: { $ne: null } }) // Sadece personeli olan kullanıcıları getir
    .populate("personnel", "fullName")
    .select("personnel")
    .lean(); // Daha hızlı sorgu için lean() kullan

  res.json(users);
});

module.exports = { getAuditLogs, getAuditLogUsers };
