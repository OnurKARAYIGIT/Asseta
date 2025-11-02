const asyncHandler = require("express-async-handler");
const AttendanceRecord = require("../models/attendanceRecordModel");
const Personnel = require("../models/personnelModel");

// @desc    Get attendance records, optionally filtered by personnel
// @route   GET /api/attendance
// @access  Private/Admin
const getAttendanceRecords = asyncHandler(async (req, res) => {
  const { personnelId, startDate, endDate } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 25;

  let filter = {};

  if (personnelId) {
    filter.personnel = personnelId;
  }

  if (startDate) {
    filter.checkIn = { ...filter.checkIn, $gte: new Date(startDate) };
  }

  if (endDate) {
    // Bitiş tarihini gün sonuna ayarlayarak o günü de dahil et
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    filter.checkIn = { ...filter.checkIn, $lte: endOfDay };
  }

  const count = await AttendanceRecord.countDocuments(filter);
  const records = await AttendanceRecord.find(filter)
    .populate("personnel", "fullName employeeId") // Personel bilgilerini ekle
    .sort({ checkIn: -1 })
    .limit(limit)
    .skip(limit * (page - 1));

  res.json({
    records,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// @desc    Get the current attendance status for the logged-in user
// @route   GET /api/attendance/status
// @access  Private
const getMyAttendanceStatus = asyncHandler(async (req, res) => {
  const personnelId = req.user.personnel;

  if (!personnelId) {
    res.status(400);
    throw new Error("Kullanıcı bir personel ile ilişkilendirilmemiş.");
  }

  const activeRecord = await AttendanceRecord.findOne({
    personnel: personnelId,
    status: "Çalışıyor",
  });

  if (activeRecord) {
    res.json({ status: "Çalışıyor", checkIn: activeRecord.checkIn });
  } else {
    res.json({ status: "Çalışmıyor" });
  }
});

// @desc    Clock in for the logged-in user
// @route   POST /api/attendance/clock-in
// @access  Private
const clockIn = asyncHandler(async (req, res) => {
  const personnelId = req.user.personnel;

  const existingRecord = await AttendanceRecord.findOne({
    personnel: personnelId,
    status: "Çalışıyor",
  });

  if (existingRecord) {
    res.status(400);
    throw new Error("Zaten aktif bir mesainiz bulunuyor.");
  }

  const newRecord = await AttendanceRecord.create({
    personnel: personnelId,
    checkIn: new Date(),
    status: "Çalışıyor",
  });

  res.status(201).json(newRecord);
});

// @desc    Clock out for the logged-in user
// @route   POST /api/attendance/clock-out
// @access  Private
const clockOut = asyncHandler(async (req, res) => {
  const personnelId = req.user.personnel;

  const activeRecord = await AttendanceRecord.findOne({
    personnel: personnelId,
    status: "Çalışıyor",
  });

  if (!activeRecord) {
    res.status(400);
    throw new Error("Sonlandırılacak aktif bir mesai bulunamadı.");
  }

  const checkOutTime = new Date();
  const checkInTime = activeRecord.checkIn;

  // Çalışma süresini dakika olarak hesapla
  const durationInMinutes = Math.round(
    (checkOutTime - checkInTime) / (1000 * 60)
  );

  // Basit fazla mesai hesaplaması (örneğin 8 saat = 480 dakika)
  const standardWorkMinutes = 8 * 60;
  let overtime = 0;
  if (durationInMinutes > standardWorkMinutes) {
    overtime = durationInMinutes - standardWorkMinutes;
  }

  activeRecord.checkOut = checkOutTime;
  activeRecord.status = "Tamamlandı";
  activeRecord.workDuration = durationInMinutes;
  activeRecord.overtime = overtime;

  const updatedRecord = await activeRecord.save();

  res.status(200).json(updatedRecord);
});

module.exports = {
  getAttendanceRecords,
  getMyAttendanceStatus,
  clockIn,
  clockOut,
};
