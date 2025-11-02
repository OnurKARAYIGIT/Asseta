const asyncHandler = require("express-async-handler");
const Assignment = require("../models/assignmentModel");
const Item = require("../models/itemModel");
const Location = require("../models/locationModel");
const User = require("../models/userModel");
const Personnel = require("../models/personnelModel.js");
const Leave = require("../models/leaveModel.js");
const AttendanceRecord = require("../models/attendanceRecordModel.js");
const PayrollPeriod = require("../models/payrollPeriodModel.js");
const PayrollRecord = require("../models/payrollRecordModel.js");

// @desc    Ana panel için optimize edilmiş istatistikleri getirir
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  // Bugünün başlangıcı ve sonu (Aktif çalışan sorgusu için)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Bu ayın başlangıcı ve sonu (Fazla mesai sorgusu için)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  // Paralel olarak birden fazla sorgu çalıştır
  const [
    // 1. Temel sayım istatistikleri
    totalItems,
    totalPersonnel, // Değişken adını daha anlamlı hale getiriyoruz
    totalLocations,
    // 2. Son 5 zimmet
    recentAssignments,
    // 3. Aylık zimmet dağılımı
    monthlyAssignments,
    // 4. Varlık türüne göre eşya dağılımı
    itemDistribution,
    // 5. Durum ve konuma göre eşya istatistikleri (Optimize edilmiş sorgu)
    itemStats,
    // --- YENİ İK İSTATİSTİKLERİ ---
    pendingLeaveCount,
    activeEmployeesToday,
    totalOvertimeThisMonth,
    lastPayrollSummary,
  ] = await Promise.all([
    Item.countDocuments({}),
    Personnel.countDocuments({}), // Artık Personnel koleksiyonunu sayıyoruz
    Location.countDocuments({}),
    Assignment.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("item", "name brand")
      .populate("company", "name")
      .populate("personnel", "fullName"), // Eksik olan personel populate işlemi eklendi.
    Assignment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$assignmentDate" },
            month: { $month: "$assignmentDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]),
    Item.aggregate([
      { $group: { _id: "$assetType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    // --- PERFORMANS İYİLEŞTİRMESİ: Zimmetlerden başlayarak tek bir sorgu ---
    Assignment.aggregate([
      // 1. En son zimmet kaydını bulmak için sırala ve grupla
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$item", // Her bir eşya için tek bir kayıt al
          lastStatus: { $first: "$status" },
          lastLocationId: { $first: "$company" },
        },
      },
      // 2. İstatistikleri hesaplamak için $facet kullan
      {
        $facet: {
          // a. Zimmetli eşya sayısı ve konuma göre dağılım
          activeAssignments: [
            { $match: { lastStatus: "Zimmetli" } },
            {
              $group: {
                _id: "$lastLocationId",
                count: { $sum: 1 },
              },
            },
            {
              $lookup: {
                from: "locations",
                localField: "_id",
                foreignField: "_id",
                as: "locationDetails",
              },
            },
            { $unwind: "$locationDetails" },
            {
              $project: {
                _id: { name: "$locationDetails.name", id: "$_id" },
                count: 1,
              },
            },
          ],
          // b. Duruma göre zimmetli eşya dağılımı
          itemsByStatus: [
            { $group: { _id: "$lastStatus", count: { $sum: 1 } } },
          ],
        },
      },
    ]),
    // 6. Bekleyen izin talepleri sayısı
    Leave.countDocuments({ status: "Beklemede" }),
    // 7. Bugün aktif olan (giriş yapmış, çıkış yapmamış) çalışan sayısı
    AttendanceRecord.countDocuments({
      checkIn: { $gte: todayStart, $lte: todayEnd },
      checkOut: null,
      status: "Devam Ediyor",
    }),
    // 8. Bu ayki toplam fazla mesai (dakika olarak)
    AttendanceRecord.aggregate([
      { $match: { checkIn: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, totalOvertime: { $sum: "$overtime" } } },
    ]),
    // 9. Son kilitli bordro döneminin özetini al
    PayrollPeriod.aggregate([
      { $match: { status: "Kilitli" } },
      { $sort: { year: -1, month: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "payrollrecords",
          localField: "_id",
          foreignField: "payrollPeriod",
          as: "records",
        },
      },
      {
        $project: {
          totalNetSalary: { $sum: "$records.netSalary" },
        },
      },
    ]),
  ]);

  // Optimize edilmiş sorgudan gelen sonuçları işle
  const stats = itemStats[0];
  const activeAssignmentsData = stats.activeAssignments || [];
  const assignedItemsByStatus = stats.itemsByStatus || [];

  // Toplam aktif zimmet sayısını hesapla
  const totalActiveAssignments = activeAssignmentsData.reduce(
    (sum, loc) => sum + loc.count,
    0
  );

  // "Boşta" olan eşya sayısını hesapla
  const totalAssignedItems = assignedItemsByStatus.reduce(
    (sum, status) => sum + status.count,
    0
  );
  const unassignedItemsCount = totalItems - totalAssignedItems;

  // "Boşta" durumunu istatistiklere ekle
  const itemsByStatus = [...assignedItemsByStatus];
  if (unassignedItemsCount > 0) {
    itemsByStatus.push({ _id: "Boşta", count: unassignedItemsCount });
  }

  res.json({
    totalAssignments: totalActiveAssignments,
    totalItems,
    totalPersonnel, // Frontend'e doğru veriyi gönder
    totalLocations,
    monthlyAssignments,
    pendingLeaveCount,
    activeEmployeesToday,
    totalOvertimeThisMonth: totalOvertimeThisMonth[0]?.totalOvertime || 0,
    lastPayrollTotal: lastPayrollSummary[0]?.totalNetSalary || 0,
    itemDistribution,
    recentAssignments,
    itemsByStatus, // "Boşta" sayısını içeren güncel liste
    itemsByLocation: activeAssignmentsData, // Konuma göre dağılım
  });
});

module.exports = {
  getDashboardStats,
};
