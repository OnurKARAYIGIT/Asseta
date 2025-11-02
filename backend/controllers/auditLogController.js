const asyncHandler = require("express-async-handler");
const AuditLog = require("../models/auditLogModel");
const Personnel = require("../models/personnelModel");

// @desc    Get all audit logs, optionally filtered by personnel
// @route   GET /api/audit-logs
// @access  Private/Admin
const getAuditLogs = asyncHandler(async (req, res) => {
  const { personnelId } = req.query;
  let filter = {};

  if (personnelId) {
    // Personel ID'sine karşılık gelen kullanıcıyı bul
    const personnel = await Personnel.findById(personnelId).select(
      "userAccount"
    );
    if (personnel && personnel.userAccount) {
      filter["user._id"] = personnel.userAccount;
    } else {
      // Eğer personelin kullanıcı hesabı yoksa veya personel bulunamazsa boş sonuç döndür
      return res.json([]);
    }
  }

  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(200); // Son 200 kaydı getir
  res.json(logs);
});

module.exports = { getAuditLogs };
