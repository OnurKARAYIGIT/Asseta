const asyncHandler = require("express-async-handler");
const Assignment = require("../models/assignmentModel");
const Item = require("../models/itemModel");
const Location = require("../models/locationModel");
const User = require("../models/userModel");
const Personnel = require("../models/personnelModel"); // Personnel modelini import et

// @desc    Ana panel için optimize edilmiş istatistikleri getirir
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
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
    itemDistribution,
    recentAssignments,
    itemsByStatus, // "Boşta" sayısını içeren güncel liste
    itemsByLocation: activeAssignmentsData, // Konuma göre dağılım
  });
});

module.exports = {
  getDashboardStats,
};
