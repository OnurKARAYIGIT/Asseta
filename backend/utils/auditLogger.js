const AuditLog = require("../models/auditLogModel");

const logAction = async (user, action, details) => {
  try {
    await AuditLog.create({
      user: user._id,
      action,
      details,
    });
  } catch (error) {
    console.error("Denetim kaydı oluşturulamadı:", error);
  }
};

module.exports = logAction;
