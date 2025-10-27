const asyncHandler = require("express-async-handler");
const Item = require("../models/itemModel");
const Assignment = require("../models/assignmentModel");
const logAction = require("../utils/auditLogger");

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

// @desc    Tüm eşyaları listeler
// @route   GET /api/items
// @access  Private
const getItems = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 15;
  const page = Number(req.query.page) || 1;
  const status = req.query.status; // 'assigned' veya 'unassigned'
  const assetType = req.query.assetType;

  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: "i" } },
          { brand: { $regex: req.query.keyword, $options: "i" } },
          { assetTag: { $regex: req.query.keyword, $options: "i" } },
          { serialNumber: { $regex: req.query.keyword, $options: "i" } },
          { assetType: { $regex: req.query.keyword, $options: "i" } },
        ],
      }
    : {};

  let filter = { ...keyword };

  // Varlık Cinsi filtresini ekle
  if (assetType) {
    filter.assetType = assetType;
  }

  // Aggregation pipeline kullanarak eşyaları ve zimmet durumlarını tek sorguda birleştir
  let pipeline = [];

  // Arama ve Varlık Cinsi filtresi
  if (Object.keys(filter).length > 0) {
    pipeline.push({ $match: filter });
  }

  // Zimmet bilgilerini ekle
  pipeline.push({
    $lookup: {
      from: "assignments",
      localField: "_id",
      foreignField: "item",
      as: "assignments",
    },
  });

  // Her eşya için en son zimmet durumunu bul
  pipeline.push({
    $addFields: {
      // Zimmetleri tarihe göre tersten sıralayıp ilkini alarak en son zimmeti bul
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
  });

  // Durum bilgisini ata
  pipeline.push({
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
            // İade Edildi, Hurda veya hiç zimmetlenmemişse "Boşta" sayılır
          ],
          default: "Boşta",
        },
      },
      assignmentId: { $ifNull: ["$lastAssignment._id", null] },
    },
  });

  // Duruma göre filtrele
  if (status) {
    // Frontend'den gelen kısa anahtar kelimeleri veritabanı durumlarına çevir
    const statusMap = {
      assigned: "Zimmetli",
      unassigned: "Boşta",
      arizali: "Arızalı",
      beklemede: "Beklemede",
      hurda: "Hurda",
    };
    if (statusMap[status]) {
      pipeline.push({ $match: { assignmentStatus: statusMap[status] } });
    }
  }

  // Toplam sayıyı ve sayfalama sonuçlarını almak için $facet kullan
  const facetPipeline = [
    ...pipeline,
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
  const {
    name,
    assetType,
    assetSubType,
    brand,
    fixedAssetType,
    assetTag,
    modelYear,
    serialNumber,
    networkInfo,
    softwareInfo,
    description,
  } = req.body;

  if (!name || !assetType) {
    res.status(400);
    throw new Error("Eşya adı ve Varlık Tipi zorunludur.");
  }

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

module.exports = {
  createItem,
  getItems,
  updateItem,
  deleteItem,
  checkUniqueness,
};
