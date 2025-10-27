const asyncHandler = require("express-async-handler");
const Assignment = require("../models/assignmentModel");
const Item = require("../models/itemModel");
const Location = require("../models/locationModel");
const User = require("../models/userModel.js");

// @desc    Ana panel için optimize edilmiş istatistikleri getirir
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalItems = await Item.countDocuments({});
  const totalUsers = await User.countDocuments({});
  const totalLocations = await Location.countDocuments({});

  // Paralel olarak birden fazla sorgu çalıştır
  const [
    statsResults,
    monthlyAssignments,
    itemDistribution,
    recentAssignments,
  ] = await Promise.all([
    // --- PERFORMANS İYİLEŞTİRMESİ: Eşya bazlı istatistikler için tek bir sorgu ---
    Item.aggregate([
      // 1. Her eşyaya ait zimmet kayıtlarını getir
      {
        $lookup: {
          from: "assignments", // "assignments" koleksiyonuna katıl
          localField: "_id", // Item._id
          foreignField: "item", // Assignment.item
          as: "assignments", // Tüm zimmetleri al
        },
      },
      {
        $addFields: {
          lastAssignment: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: "$assignments",
                  sortBy: { createdAt: -1 },
                },
              },
              0,
            ],
          },
          // Eşyanın aktif bir zimmeti olup olmadığını kontrol et
          hasActiveAssignment: {
            $anyElementTrue: {
              $map: {
                input: "$assignments",
                as: "assign",
                in: {
                  $in: [
                    "$$assign.status",
                    ["Zimmetli", "Arızalı", "Beklemede"],
                  ],
                },
              },
            },
          },
        },
      },
      // 3. Eşyanın nihai durumunu ve konumunu belirle
      {
        $project: {
          _id: 1,
          assetType: 1,
          // Bir eşyanın nihai durumu, aktif zimmetlerinin durumuna göre belirlenir.
          status: {
            $cond: {
              if: "$hasActiveAssignment",
              then: {
                // Eğer aktif bir zimmet varsa, durumu "Zimmetli" olarak ayarla.
                // Not: Daha karmaşık senaryolar için (örn: aynı anda hem Arızalı hem Zimmetli),
                // buradaki mantık daha da geliştirilebilir. Şimdilik öncelik Zimmetli'de.
                $cond: {
                  if: { $in: ["Zimmetli", "$assignments.status"] },
                  then: "Zimmetli",
                  else: "$lastAssignment.status",
                },
              },
              else: "Boşta",
            },
          },
          locationId: { $ifNull: ["$lastAssignment.company", null] },
        },
      },
      // 4. Tüm istatistikleri tek seferde hesaplamak için $facet kullan
      {
        $facet: {
          // a. Eşya durumlarına göre dağılım
          itemsByStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],

          // b. Aktif zimmetli eşya sayısı
          totalActiveAssignments: [
            { $match: { status: "Zimmetli" } },
            { $count: "count" },
          ],

          // c. Konuma göre zimmetli eşya sayısı
          itemsByLocation: [
            { $match: { status: "Zimmetli" } }, // Sadece zimmetli olanları say
            {
              $lookup: {
                from: "locations",
                localField: "locationId",
                foreignField: "_id",
                as: "locationDetails",
              },
            },
            { $unwind: "$locationDetails" },
            // Frontend'de tıklama işlevi için locationId'yi de ekleyelim
            {
              $group: {
                _id: { name: "$locationDetails.name", id: "$locationId" },
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]),
    // Son 12 aydaki zimmet sayısı (Bu sorgu Assignment modeline ait olduğu için ayrı kalmalı)
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
    // Varlık türüne göre eşya dağılımı (Bu sorgu diğerlerinden bağımsız)
    Item.aggregate([
      { $group: { _id: "$assetType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }, // En popüler 5 türü göster
    ]),
    // Son 5 zimmet (Bu sorgu Assignment modeline ait olduğu için ayrı kalmalı)
    Assignment.find({})
      .sort({ createdAt: -1 })
      .limit(5) // Son 5 zimmeti getir
      .populate("item", "name brand")
      .populate("company", "name"),
  ]);

  // İstatistik sonuçlarını ayrıştır
  const {
    totalActiveAssignments: totalActiveArr = [],
    itemsByStatus = [],
    itemsByLocation = [],
  } = statsResults[0] || {};

  const totalActiveAssignments = totalActiveArr[0]?.count || 0;

  res.json({
    totalAssignments: totalActiveAssignments,
    totalItems,
    totalUsers,
    totalLocations,
    itemsByStatus,
    monthlyAssignments,
    itemDistribution,
    recentAssignments,
    itemsByLocation,
  });
});

module.exports = {
  getDashboardStats,
};
