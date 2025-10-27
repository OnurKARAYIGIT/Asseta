const asyncHandler = require("express-async-handler");
const Assignment = require("../models/assignmentModel");
const Item = require("../models/itemModel.js");
const logAction = require("../utils/auditLogger");

// @desc    Yeni bir zimmet kaydı oluşturur
// @route   POST /api/assignments
// @access  Private/Admin
const createAssignment = asyncHandler(async (req, res) => {
  const {
    // 'item' yerine 'items' (dizi) olarak alıyoruz
    items,
    personnelName,
    company,
    unit,
    personnelId,
    previousUser,
    registeredSection,
    assignmentNotes,
    formPath,
  } = req.body;

  if (!items || items.length === 0 || !personnelName || !company) {
    res.status(400);
    throw new Error("Lütfen tüm zorunlu alanları doldurun.");
  }

  const createdAssignments = [];

  const assignmentsToCreate = items.map((itemId) => {
    const assignmentData = {
      item: itemId,
      personnelName,
      company,
      unit,
      personnelId,
      previousUser,
      registeredSection,
      assignmentNotes,
      formPath,
      history: [
        {
          user: req.user._id,
          username: req.user.username,
          changes: [{ field: "status", from: "yok", to: "oluşturuldu" }],
        },
      ],
    };
    return assignmentData;
  });

  // Her bir item ID'si için ayrı bir zimmet oluştur
  const newAssignments = await Assignment.insertMany(assignmentsToCreate);

  await logAction(
    req.user,
    "ZİMMET_OLUŞTURULDU",
    `'${personnelName}' personeline ${items.length} adet yeni zimmet kaydı oluşturuldu.`
  );
  res.status(201).json(newAssignments);
});

// @desc    Tüm zimmetleri listeler
// @route   GET /api/assignments
// @access  Private
const getAssignments = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 15;
  const page = Number(req.query.page) || 1;

  // Sıralama
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const sortBy = req.query.sortBy || "createdAt";
  const sortConfig = { [sortBy]: sortOrder };

  // Agregasyon için temel filtreler
  let filter = {};

  // Konum filtresi
  if (req.query.location) {
    // Mongoose.Types.ObjectId'ye çevirerek doğru eşleşme sağlıyoruz.
    filter["company"] = new mongoose.Types.ObjectId(req.query.location);
  }

  // Durum filtresi
  if (req.query.status) {
    filter.status = req.query.status;
  } else {
    filter.status = { $ne: "Beklemede" };
  }

  // Arama terimi (keyword) filtresi
  const keyword = req.query.keyword;
  if (keyword) {
    const regex = { $regex: keyword, $options: "i" };
    filter.$or = [
      { personnelName: regex },
      { unit: regex },
      { location: regex },
      // İlişkili item belgesindeki alanlarda arama yapmak için
      // bu alanları agregasyon sonrası $match'e ekleyeceğiz.
    ];
  }

  // Agregasyon pipeline'ı
  const pipeline = [
    // 1. Eşya bilgilerini ekle
    {
      $lookup: {
        from: "items",
        localField: "item",
        foreignField: "_id",
        as: "item",
      },
    },
    // 2. Eşya bir dizi olduğu için objeye çevir
    { $unwind: "$item" },
    // 3. Şirket/Konum bilgilerini ekle
    {
      $lookup: {
        from: "locations", // Model adınız 'Location' ise collection adı 'locations' olmalı
        localField: "company",
        foreignField: "_id",
        as: "company",
      },
    },
    // 4. Şirket bir dizi olduğu için objeye çevir
    { $unwind: "$company" },
    // 5. Temel filtreleri uygula (performans için erken aşamada)
    { $match: filter },
  ];

  // 6. Eğer keyword varsa, item alanlarını da içeren ek bir $match uygula
  if (keyword) {
    const regex = { $regex: keyword, $options: "i" };
    pipeline.push({
      $match: {
        $or: [
          { personnelName: regex },
          { unit: regex },
          { location: regex },
          { "item.name": regex },
          { "item.assetTag": regex },
          { "item.serialNumber": regex },
          { "item.brand": regex },
        ],
      },
    });
  }

  // Sayfalama ve sonuçları almak için $facet kullan
  const facetPipeline = [
    ...pipeline,
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: sortConfig },
          { $skip: pageSize * (page - 1) },
          { $limit: pageSize },
        ],
      },
    },
  ];

  const results = await Assignment.aggregate(facetPipeline);

  const assignments = results[0].data;
  const count = results[0].metadata[0] ? results[0].metadata[0].total : 0;

  res.json({
    assignments,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    ID ile tek bir zimmet kaydını getirir
// @route   GET /api/assignments/:id
// @access  Private
const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate("item")
    .populate("company", "name");

  if (assignment) {
    res.json(assignment);
  } else {
    res.status(404);
    throw new Error("Zimmet kaydı bulunamadı");
  }
});

// @desc    Bir zimmet kaydını günceller
// @route   PUT /api/assignments/:id
// @access  Private/Admin
const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate(
    "item",
    "name assetTag"
  );

  if (assignment) {
    const updatableFields = [
      "status",
      "returnDate",
      "assignmentNotes",
      "personnelName",
      "unit",
      "location",
      "registeredSection",
      "previousUser",
      "formPath",
      "company",
      "assignmentDate",
    ];
    const changes = [];

    for (const field of updatableFields) {
      // `returnDate` gibi null olabilecek alanlar için `!= null` kontrolü önemli.
      if (req.body[field] != null && req.body[field] !== assignment[field]) {
        changes.push({
          field: field,
          from: assignment[field],
          to: req.body[field],
        });
        assignment[field] = req.body[field];
      }
    }

    // Eşya bilgilerini güncelleme
    const { itemData } = req.body;
    // Sadece itemData varsa VE zimmete bağlı bir eşya gerçekten varsa güncelle
    if (itemData && assignment.item) {
      const item = assignment.item;
      const itemChanges = [];
      for (const key in itemData) {
        if (itemData[key] !== item[key]) {
          itemChanges.push({
            field: `item.${key}`,
            from: item[key],
            to: itemData[key],
          });
          item[key] = itemData[key];
        }
      }
      if (itemChanges.length > 0) {
        await item.save();
        // Eşya değişikliklerini de aynı geçmiş kaydına ekle
        changes.push(...itemChanges);
      }
    }

    // Eğer değişiklik varsa, geçmişe ekle
    if (changes.length > 0) {
      assignment.history.push({
        user: req.user._id,
        username: req.user.username,
        changes: changes,
      });
    }

    // --- Daha Akıllı Loglama ---
    // Eğer zimmetin durumu 'Beklemede'den 'Zimmetli'ye değiştiriliyorsa, bunu 'ONAYLANDI' olarak logla.
    const statusChange = changes.find((c) => c.field === "status");
    if (
      statusChange &&
      statusChange.from === "Beklemede" &&
      statusChange.to === "Zimmetli"
    ) {
      await logAction(
        req.user,
        "ZİMMET_ONAYLANDI",
        `'${assignment.personnelName}' personeline ait '${assignment.item.name}' (Demirbaş No: ${assignment.item.assetTag}) zimmet talebi onaylandı.`
      );
    } else {
      await logAction(
        req.user,
        "ZİMMET_GÜNCELLENDİ",
        `'${assignment.personnelName}' personeline ait '${assignment.item.name}' (Demirbaş No: ${assignment.item.assetTag}) zimmeti güncellendi.`
      );
    }

    const updatedAssignment = await assignment.save();
    res.json(updatedAssignment);
  } else {
    res.status(404);
    throw new Error("Zimmet kaydı bulunamadı");
  }
});

// @desc    Bir zimmet kaydını siler
// @route   DELETE /api/assignments/:id
// @access  Private/Admin
const deleteAssignment = asyncHandler(async (req, res) => {
  // Log mesajında eşya adını kullanabilmek için 'item' alanını populate ediyoruz.
  const assignment = await Assignment.findById(req.params.id).populate(
    "item",
    "name assetTag"
  );

  if (assignment) {
    // --- Daha Akıllı Loglama ---
    // Eğer silinen zimmetin durumu 'Beklemede' ise, bunu 'REDDEDİLDİ' olarak logla.
    if (assignment.status === "Beklemede") {
      const logMessage = `'${assignment.personnelName}' personeline ait '${
        assignment.item?.name || "Bilinmeyen Eşya"
      }' zimmet talebi reddedildi.`;
      await logAction(req.user, "ZİMMET_REDDEDİLDİ", logMessage);
    } else {
      const logMessage = `'${assignment.personnelName}' personeline ait '${
        assignment.item?.name || "Bilinmeyen Eşya"
      }' zimmet kaydı silindi.`;
      await logAction(req.user, "ZİMMET_SİLİNDİ", logMessage);
    }
    await assignment.deleteOne();
    res.json({ message: "Zimmet kaydı silindi" });
  } else {
    res.status(404);
    throw new Error("Zimmet kaydı bulunamadı");
  }
});

// @desc    Bekleyen zimmetleri personele göre gruplayarak listeler
// @route   GET /api/assignments/pending-grouped
// @access  Private
const getPendingGroupedAssignments = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 10; // Sayfa başına personel grubu sayısı
  const page = Number(req.query.page) || 1;

  const pipeline = [
    // 1. Sadece "Beklemede" durumundaki zimmetleri filtrele
    { $match: { status: "Beklemede" } },
    // 2. İlgili eşya bilgilerini ekle
    {
      $lookup: {
        from: "items",
        localField: "item",
        foreignField: "_id",
        as: "item",
      },
    },
    // 3. Eşya bir dizi olduğu için objeye çevir
    { $unwind: "$item" },
    // 4. Personel adına göre grupla
    {
      $group: {
        _id: "$personnelName", // Personel adına göre grupla
        personnelName: { $first: "$personnelName" }, // Personel adını al
        personnelId: { $first: "$personnelId" }, // Personel ID'sini al (varsa)
        assignments: { $push: "$$ROOT" }, // Grubun tüm zimmetlerini bir diziye ekle
        count: { $sum: 1 }, // Her gruptaki zimmet sayısını say
      },
    },
    // 5. Sonuçları personel adına göre sırala
    { $sort: { personnelName: 1 } },
    // 6. Sayfalama için $facet kullan
    {
      $facet: {
        metadata: [{ $count: "total" }], // Toplam personel grubu sayısını al
        data: [{ $skip: pageSize * (page - 1) }, { $limit: pageSize }],
      },
    },
  ];

  const results = await Assignment.aggregate(pipeline);

  const personnelGroups = results[0].data;
  const totalGroups = results[0].metadata[0] ? results[0].metadata[0].total : 0;

  res.json({
    assignments: personnelGroups, // Artık bu, gruplanmış personel listesi
    page,
    pages: Math.ceil(totalGroups / pageSize),
    total: totalGroups,
  });
});

// @desc    Personele göre zimmetleri arar
// @route   GET /api/assignments/search
// @access  Private
const getAssignmentsByPersonnel = asyncHandler(async (req, res) => {
  const { personnelName, personnelId, exact, itemAssetTag } = req.query; // itemAssetTag eklendi

  if (!personnelName && !personnelId && !itemAssetTag) {
    return res.json([]);
  }

  // Arama kriterini oluştur
  let matchStage = {};

  if (itemAssetTag) {
    // Eğer itemAssetTag geldiyse, item lookup'ından sonra eşleşme yap
    // Bu aşamada sadece genel bir matchStage oluşturuyoruz, asıl filtre lookup sonrası olacak.
  }

  if (personnelId) {
    matchStage.personnelId = personnelId;
  } else if (personnelName) {
    if (exact === "true") {
      matchStage.personnelName = personnelName;
    } else {
      matchStage.personnelName = { $regex: personnelName, $options: "i" };
    }
  }

  // Aggregation pipeline kullanarak veritabanında gruplama yap
  let pipeline = [
    // 1. Arama kriterine uyan zimmetleri bul
    { $match: matchStage },
    // 2. Gruplamadan önce verileri tarihe göre sırala
    { $sort: { assignmentDate: -1 } },
    // 3. İlgili 'item' ve 'company' bilgilerini ekle (populate gibi)
    {
      $lookup: {
        from: "items",
        localField: "item",
        foreignField: "_id",
        as: "item",
      },
    },
    { $unwind: { path: "$item", preserveNullAndEmptyArrays: true } }, // Eşya silinmişse bile zimmeti koru
    {
      $lookup: {
        from: "locations", // Model adı 'Location' ise collection adı 'locations' olmalı
        localField: "company",
        foreignField: "_id",
        as: "company",
      },
    },
    { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
  ];

  if (itemAssetTag) {
    pipeline.push({ $match: { "item.assetTag": itemAssetTag } });
  }

  // 4. Personel ID'sine veya ismine göre grupla
  pipeline.push({
    $group: {
      _id: { personnelId: "$personnelId", personnelName: "$personnelName" },
      personnelId: { $first: "$personnelId" },
      personnelName: { $first: "$personnelName" },
      assignments: { $push: "$$ROOT" }, // Grubun tüm zimmetlerini bir diziye ekle
    },
  });

  // 5. Sonucu frontend dostu bir formata dönüştür
  pipeline.push({
    $project: {
      _id: 0, // MongoDB'nin _id'sini kaldır
      personnelId: 1,
      personnelName: 1,
      assignments: 1, // assignments dizisini koru
    },
  });

  const groupedByPersonnel = await Assignment.aggregate(pipeline);
  res.json(groupedByPersonnel);
});

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentsByPersonnel,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getPendingGroupedAssignments,
};
