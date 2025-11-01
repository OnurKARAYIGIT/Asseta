const asyncHandler = require("express-async-handler");
const Item = require("../models/itemModel");
const Assignment = require("../models/assignmentModel");
const logAction = require("../utils/auditLogger");
const XLSX = require("xlsx");

// Yinelenen hata kodunu işlemek için yardımcı fonksiyon
const handleDuplicateKeyError = (error, res) => {
  if (error.code === 11000) {
    res.status(400);
    if (error.keyPattern.assetTag) {
      throw new Error("Bu demirbaş numarası zaten kayıtlı.");
    }
    if (error.keyPattern.serialNumber) {
      throw new Error("Bu seri numarası zaten kayıtlı.");
    }
  }
  throw error; // Diğer hataları yeniden fırlat
};

// @desc    Yeni bir eşya oluşturur
// @route   POST /api/items
// @access  Private/Admin
const createItem = asyncHandler(async (req, res) => {
  const {
    name,
    assetType,
    brand,
    fixedAssetType,
    assetTag,
    assetSubType,
    modelYear,
    serialNumber,
    networkInfo,
    softwareInfo,
    description,
    status, // status alanını request body'den al
    cost,
    purchaseDate,
    warrantyPeriod,
  } = req.body;

  if (!name || !assetType) {
    res.status(400);
    throw new Error("Eşya adı ve Varlık Tipi zorunludur.");
  }

  const item = new Item({
    name,
    assetType,
    brand,
    fixedAssetType,
    assetTag,
    assetSubType,
    modelYear,
    serialNumber,
    networkInfo,
    softwareInfo,
    description,
    cost,
    purchaseDate,
    warrantyPeriod,
    status: status || "Boşta", // Eğer status gelmezse varsayılan olarak 'Boşta' ata
  });

  try {
    const createdItem = await item.save();
    await logAction(
      req.user,
      "EŞYA_OLUŞTURULDU",
      `'${createdItem.name}' adlı yeni bir eşya oluşturuldu.`
    );
    res.status(201).json(createdItem);
  } catch (error) {
    handleDuplicateKeyError(error, res);
  }
});

// getItems ve exportItems için ortak aggregation pipeline oluşturan yardımcı fonksiyon
const buildItemsQueryPipeline = (queryParams) => {
  const { status, assetType, keyword: keywordQuery } = queryParams;

  const keyword = keywordQuery
    ? {
        $or: [
          { name: { $regex: keywordQuery, $options: "i" } },
          { brand: { $regex: keywordQuery, $options: "i" } },
          { assetTag: { $regex: keywordQuery, $options: "i" } },
          { serialNumber: { $regex: keywordQuery, $options: "i" } },
          { assetType: { $regex: keywordQuery, $options: "i" } },
        ],
      }
    : {};

  let filter = { ...keyword };

  if (assetType) {
    filter.assetType = assetType;
  }

  let pipeline = [];

  if (Object.keys(filter).length > 0) {
    pipeline.push({ $match: filter });
  }

  pipeline.push(
    {
      $lookup: {
        from: "assignments",
        localField: "_id",
        foreignField: "item",
        as: "assignments",
      },
    },
    {
      $addFields: {
        lastAssignment: {
          $arrayElemAt: [
            {
              $sortArray: {
                input: "$assignments",
                sortBy: { assignmentDate: -1 },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        assignmentStatus: {
          $switch: {
            branches: [
              {
                case: { $eq: ["$lastAssignment.status", "Zimmetli"] },
                then: "Zimmetli",
              },
              {
                case: { $eq: ["$lastAssignment.status", "Arızalı"] },
                then: "Arızalı",
              },
              {
                case: { $eq: ["$lastAssignment.status", "Beklemede"] },
                then: "Beklemede",
              },
              {
                case: { $eq: ["$lastAssignment.status", "Hurda"] },
                then: "Hurda",
              },
            ],
            default: "Boşta",
          },
        },
        assignmentId: { $ifNull: ["$lastAssignment._id", null] },
      },
    }
  );

  // Duruma göre filtrele
  const statusMap = {
    assigned: "Zimmetli",
    unassigned: "Boşta",
    arizali: "Arızalı",
    beklemede: "Beklemede",
    hurda: "Hurda",
  };
  if (status && statusMap[status]) {
    pipeline.push({ $match: { assignmentStatus: statusMap[status] } });
  }

  return pipeline;
};

// @desc    Tüm eşyaları listeler
// @route   GET /api/items
// @access  Private
const getItems = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 15;
  const page = Number(req.query.page) || 1;
  const status = req.query.status; // 'assigned' veya 'unassigned'

  // Ortak pipeline'ı oluştur
  const basePipeline = buildItemsQueryPipeline(req.query);

  // Toplam sayıyı ve sayfalama sonuçlarını almak için $facet kullan
  const facetPipeline = [
    ...basePipeline,
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: pageSize * (page - 1) },
          { $limit: pageSize },
        ],
      },
    },
  ];

  const results = await Item.aggregate(facetPipeline);
  const itemsWithStatus = results[0].data;
  const count = results[0].metadata[0] ? results[0].metadata[0].total : 0;

  res.json({
    items: itemsWithStatus,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (item) {
    Object.assign(item, req.body);
    try {
      await logAction(
        req.user,
        "EŞYA_GÜNCELLENDİ",
        `'${item.name}' adlı eşya güncellendi.`
      );
      const updatedItem = await item.save();
      res.json(updatedItem);
    } catch (error) {
      handleDuplicateKeyError(error, res);
    }
  } else {
    res.status(404);
    throw new Error("Eşya bulunamadı.");
  }
});

// @desc    Bir eşyayı siler
// @route   DELETE /api/items/:id
// @access  Private/Admin
const deleteItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (item) {
    await logAction(
      req.user,
      "EŞYA_SİLİNDİ",
      `'${item.name}' adlı eşya silindi.`
    );
    await item.deleteOne();
    res.json({ message: "Eşya başarıyla silindi." });
  } else {
    res.status(404);
    throw new Error("Eşya bulunamadı.");
  }
});

// @desc    Bir alanın değerinin benzersiz olup olmadığını kontrol eder
// @route   POST /api/items/check-unique
// @access  Private/Admin
const checkUniqueness = asyncHandler(async (req, res) => {
  const { field, value, itemId } = req.body;

  if (!field || !value) {
    res.status(400);
    throw new Error("Kontrol için alan ve değer gereklidir.");
  }

  const filter = { [field]: value };

  // Düzenleme sırasında mevcut kaydı kontrol dışı bırak
  if (itemId) {
    filter._id = { $ne: itemId };
  }

  const item = await Item.findOne(filter);

  res.json({ isUnique: !item });
});

// @desc    Filtrelenmiş eşyaları Excel dosyası olarak dışa aktarır
// @route   GET /api/items/export
// @access  Private
const exportItems = asyncHandler(async (req, res) => {
  // Ortak pipeline'ı oluştur (sayfalama olmadan)
  const pipeline = buildItemsQueryPipeline(req.query);
  const items = await Item.aggregate(pipeline);

  // Excel için veriyi formatla
  const dataToExport = items.map((item) => ({
    "Eşya Adı": item.name,
    Durum: item.assignmentStatus,
    "Varlık Cinsi": item.assetType,
    "Demirbaş No": item.assetTag,
    "Seri Numarası": item.serialNumber,
    "Marka / Model": item.brand,
    "Model Yılı": item.modelYear,
    "Oluşturulma Tarihi": new Date(item.createdAt).toLocaleDateString("tr-TR"),
    "Maliyet (TL)": item.cost,
    "Satın Alma Tarihi": item.purchaseDate
      ? new Date(item.purchaseDate).toLocaleDateString("tr-TR")
      : "",
    "Garanti Süresi (Ay)": item.warrantyPeriod,
  }));

  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Eşyalar");

  // Dosyayı bir buffer'a yaz
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

  // Yanıt başlıklarını ayarla ve dosyayı gönder
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="Esya_Listesi.xlsx"'
  );
  res.send(buffer);
});

module.exports = {
  createItem,
  getItems,
  updateItem,
  deleteItem,
  checkUniqueness,
  exportItems,
};
