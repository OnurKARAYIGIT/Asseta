const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
// Not: Bu değişiklik sonrası model importları güncellenmeli
const Personnel = require("../models/personnelModel");
const Assignment = require("../models/assignmentModel");
const Item = require("../models/itemModel.js");
const logAction = require("../utils/auditLogger");
const ReturnReceipt = require("../models/returnReceiptModel.js"); // Yeni modeli import et
const PDFDocument = require("pdfkit"); // PDFKit'i import et
const path = require("path"); // path modülünü import et
const fs = require("fs"); // Dosya sistemi işlemleri için 'fs' modülünü ekle

// Dosya adlarındaki Türkçe karakterleri ve geçersiz karakterleri temizlemek için yardımcı fonksiyon
const sanitizeFilename = (name) => {
  return name
    .replace(/Ğ/g, "G")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "U")
    .replace(/ü/g, "u")
    .replace(/Ş/g, "S")
    .replace(/ş/g, "s")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .replace(/Ö/g, "O")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "C")
    .replace(/ç/g, "c")
    .replace(/\s/g, "_"); // Boşlukları alt çizgi ile değiştir
};

// @desc    Yeni bir zimmet kaydı oluşturur
// @route   POST /api/assignments
// @access  Private/Admin
const createAssignment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  const {
    // 'item' yerine 'items' (dizi) olarak alıyoruz
    items,
    personnelId, // Frontend'den personel ObjectId'si gelecek
    company,
    unit,
    registeredSection,
    assignmentNotes,
    formPath,
  } = req.body;

  if (!items || items.length === 0 || !personnelId || !company) {
    res.status(400);
    throw new Error("Lütfen tüm zorunlu alanları doldurun.");
  }

  session.startTransaction();
  try {
    // 1. Seçilen eşyaların durumunu kontrol et
    const itemsToAssign = await Item.find({ _id: { $in: items } }).session(
      session
    );

    const unavailableItems = itemsToAssign.filter(
      (item) => item.status !== "Boşta"
    );

    if (unavailableItems.length > 0) {
      throw new Error(
        `Aşağıdaki eşyalar zimmete uygun değil: ${unavailableItems
          .map((item) => item.name)
          .join(", ")}`
      );
    }

    // 2. Zimmetleri oluştur
    const assignmentsToCreate = items.map((itemId) => ({
      item: itemId,
      personnel: personnelId,
      company,
      unit,
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
    }));

    const newAssignments = await Assignment.insertMany(assignmentsToCreate, {
      session,
    });

    // 3. Eşyaların durumunu 'Zimmetli' olarak güncelle
    await Item.updateMany(
      { _id: { $in: items } },
      { $set: { status: "Zimmetli" } },
      { session }
    );

    // 4. İşlemi onayla ve logla
    await session.commitTransaction();

    // Frontend'e göndermeden önce oluşturulan zimmetleri GEREKLİ TÜM BİLGİLERLE populate et.
    // Bu, yazdırma gibi sonraki işlemlerin doğru veriye sahip olmasını garanti eder.
    const populatedAssignments = await Assignment.find({
      _id: { $in: newAssignments.map((a) => a._id) },
    })
      .populate("item")
      .populate("personnel", "fullName employeeId department")
      .populate("company", "name")
      .lean(); // Daha hızlı ve temiz sonuçlar için .lean() kullan

    await logAction(
      req.user,
      "ZİMMET_OLUŞTURULDU",
      `'${
        populatedAssignments[0].personnel?.fullName || "Bilinmeyen"
      }' personeline ${items.length} adet yeni zimmet kaydı oluşturuldu.`
    );

    res.status(201).json({ data: populatedAssignments });
  } catch (error) {
    await session.abortTransaction();
    res.status(400); // Hata durumunda 400 Bad Request dön
    throw new Error(error.message || "Zimmet oluşturulurken bir hata oluştu.");
  } finally {
    session.endSession();
  }
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

  // Durum filtresi
  if (req.query.status) {
    filter.status = req.query.status;
  } else {
    filter.status = { $ne: "Beklemede" };
  }

  // Arama terimi (keyword) filtresi

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
    { $unwind: { path: "$item", preserveNullAndEmptyArrays: true } },
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
    { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
    // YENİ: Personel bilgilerini ekle
    {
      $lookup: {
        from: "personnels", // Personnel modelinin collection adı
        localField: "personnel",
        foreignField: "_id",
        as: "personnel",
      },
    },
    // YENİ: Personel bir dizi olduğu için objeye çevir
    { $unwind: { path: "$personnel", preserveNullAndEmptyArrays: true } },
    // 5. Durum filtresini uygula
    { $match: filter },
  ];

  // YENİ: Konum filtresini, company bilgileri eklendikten SONRA uygula
  if (req.query.location) {
    if (mongoose.Types.ObjectId.isValid(req.query.location)) {
      pipeline.push({
        $match: {
          "company._id": new mongoose.Types.ObjectId(req.query.location),
        },
      });
    }
  }

  // 6. Eğer keyword varsa, item alanlarını da içeren ek bir $match uygula
  const keyword = req.query.keyword;
  if (keyword && keyword.trim() !== "") {
    const regex = { $regex: keyword, $options: "i" };
    pipeline.push({
      $match: {
        $or: [
          { "personnel.fullName": regex }, // personnelName yerine
          { unit: regex },
          { location: regex },
          { "item.name": regex },
          { "item.assetTag": regex },
          { "item.serialNumber": regex },
          { "item.brand": regex },
          { "personnel.employeeId": regex }, // Sicil no ile arama
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
    .populate("company", "name")
    .populate("personnel", "fullName employeeId department"); // Personel bilgilerini de getir

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
  const assignment = await Assignment.findById(req.params.id)
    .populate("item", "name assetTag")
    .populate("personnel", "fullName");

  if (assignment) {
    const updatableFields = [
      "status",
      "returnDate",
      "assignmentNotes",
      "personnel", // personnelName yerine
      "unit",
      "location",
      "registeredSection",
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
        username: req.user.username, // Tutarlılık için sicil no (username) kullanılmalı
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
        `'${assignment.personnel.fullName}' personeline ait '${assignment.item.name}' (Demirbaş No: ${assignment.item.assetTag}) zimmet talebi onaylandı.`
      );
    } else {
      await logAction(
        req.user,
        "ZİMMET_GÜNCELLENDİ",
        `'${assignment.personnel.fullName}' personeline ait '${assignment.item.name}' (Demirbaş No: ${assignment.item.assetTag}) zimmeti güncellendi.`
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
  const assignment = await Assignment.findById(req.params.id)
    .populate("item", "name assetTag")
    .populate("personnel", "fullName");

  if (assignment) {
    // --- Daha Akıllı Loglama ---
    // Eğer silinen zimmetin durumu 'Beklemede' ise, bunu 'REDDEDİLDİ' olarak logla.
    if (assignment.status === "Beklemede") {
      const logMessage = `'${
        assignment.personnel?.fullName || "Bilinmeyen Personel"
      }' personeline ait '${
        assignment.item?.name || "Bilinmeyen Eşya"
      }' zimmet talebi reddedildi.`;
      await logAction(req.user, "ZİMMET_REDDEDİLDİ", logMessage);
    } else {
      const logMessage = `'${
        assignment.personnel?.fullName || "Bilinmeyen Personel"
      }' personeline ait '${
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
    // YENİ: Personel bilgilerini ekle
    {
      $lookup: {
        from: "personnels",
        localField: "personnel",
        foreignField: "_id",
        as: "personnelInfo",
      },
    },
    { $unwind: "$personnelInfo" },
    // 4. Personel'e göre grupla
    {
      $group: {
        _id: "$personnel", // Personel ObjectId'sine göre grupla
        personnelName: { $first: "$personnelInfo.fullName" }, // Personel adını al
        personnelId: { $first: "$personnelInfo._id" }, // Personel ID'sini al
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
    matchStage.personnel = new mongoose.Types.ObjectId(personnelId);
  } else if (personnelName) {
    // Artık personnelName ile doğrudan arama yapmıyoruz, lookup sonrası yapacağız.
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
    // YENİ: Personel bilgilerini ekle
    {
      $lookup: {
        from: "personnels",
        localField: "personnel",
        foreignField: "_id",
        as: "personnelInfo",
      },
    },
    { $unwind: { path: "$personnelInfo", preserveNullAndEmptyArrays: true } },
  ];

  if (itemAssetTag) {
    pipeline.push({ $match: { "item.assetTag": itemAssetTag } });
  }

  // Eğer personnelName ile arama yapılıyorsa, lookup'tan sonra filtrele
  if (personnelName) {
    const regex = { $regex: personnelName, $options: "i" };
    pipeline.push({
      $match: { "personnelInfo.fullName": regex },
    });
  }

  // 4. Personel'e göre grupla
  pipeline.push({
    $group: {
      _id: "$personnel",
      personnel: { $first: "$personnelInfo" },
      assignments: { $push: "$$ROOT" }, // Grubun tüm zimmetlerini bir diziye ekle
    },
  });

  // 5. Sonucu frontend dostu bir formata dönüştür
  pipeline.push({
    $project: {
      _id: 0, // MongoDB'nin _id'sini kaldır
      personnelId: "$personnel._id",
      personnelName: "$personnel.fullName",
      assignments: 1, // assignments dizisini koru
    },
  });

  const groupedByPersonnel = await Assignment.aggregate(pipeline);
  res.json(groupedByPersonnel);
});

// @desc    Bir zimmet için PDF formu oluşturur ve gönderir
// @route   GET /api/assignments/:id/print
// @access  Private
const printAssignmentForm = asyncHandler(async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("item")
      .populate("personnel", "fullName employeeId department position")
      .populate("company", "name");

    if (!assignment) {
      res.status(404);
      throw new Error("Zimmet kaydı bulunamadı.");
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="zimmet_formu_${sanitizeFilename(
        assignment.personnel?.fullName || "Bilinmeyen_Personel"
      )}_${sanitizeFilename(
        assignment.item?.assetTag || "bilinmeyen_esya"
      )}.pdf"`
    );

    doc.pipe(res);

    let mainFont = "Helvetica";
    const fontPath = path.join(__dirname, "../assets/fonts/DejaVuSans.ttf");
    if (fs.existsSync(fontPath)) {
      doc.registerFont("DejaVu", fontPath);
      mainFont = "DejaVu";
    } else {
      console.warn("UYARI: DejaVu font dosyası bulunamadı.");
    }

    const drawHeader = () => {
      const headerY = 45;
      const logoPath = path.join(__dirname, "../assets/images/logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, headerY, { width: 100 });
      } else {
        console.warn("UYARI: Logo dosyası bulunamadı.");
      }
      doc
        .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
        .fontSize(18)
        .text("ZİMMET TESLİM TUTANAĞI", 50, headerY + 15, { align: "right" });
      doc.font(mainFont).fontSize(9);
      doc.text(`Belge No: ${assignment._id}`, { align: "right" });
      doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, {
        align: "right",
      });
      doc
        .moveTo(50, headerY + 60)
        .lineTo(550, headerY + 60)
        .strokeColor("#dddddd")
        .stroke();
    };

    const drawTableRow = (y, label, value) => {
      doc
        .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
        .fontSize(9)
        .fillColor("#333333")
        .text(label, 70, y);
      doc
        .font(mainFont)
        .fontSize(10)
        .fillColor("#000000")
        .text(value || "-", 200, y);
    };

    const drawSection = (y, title, data) => {
      doc
        .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
        .fontSize(11)
        .fillColor("#0056b3")
        .text(title, 50, y);
      doc
        .moveTo(50, y + 18)
        .lineTo(550, y + 18)
        .strokeColor("#0056b3")
        .stroke();
      let currentY = y + 30;
      data.forEach((item) => {
        drawTableRow(currentY, item.label, item.value);
        currentY += 20;
      });
      return currentY;
    };

    const drawFooter = () => {
      const pageHeight = doc.page.height;
      doc
        .fontSize(8)
        .font(mainFont)
        .fillColor("#999999")
        .text(
          `${
            assignment.company?.name || "Bilinmeyen Konum"
          } | Bu belge Asseta Varlık Yönetim Sistemi tarafından oluşturulmuştur.`,
          50,
          pageHeight - 40,
          { align: "center", lineBreak: false }
        );
    };

    drawHeader();
    let currentY = 140;
    const personnelInfo = [
      { label: "Adı Soyadı", value: assignment.personnel?.fullName },
      { label: "Sicil Numarası", value: assignment.personnel?.employeeId },
      { label: "Departman", value: assignment.personnel?.department },
      { label: "Görevi / Unvanı", value: assignment.personnel?.position },
    ];
    currentY = drawSection(
      currentY,
      "TESLİM ALAN PERSONEL BİLGİLERİ",
      personnelInfo
    );

    currentY += 20;
    const itemInfo = [
      { label: "Malzeme Adı", value: assignment.item?.name },
      { label: "Marka / Model", value: assignment.item?.brand },
      { label: "Demirbaş Numarası", value: assignment.item?.assetTag },
      { label: "Seri Numarası", value: assignment.item?.serialNumber },
      {
        label: "Zimmet Tarihi",
        value: assignment.assignmentDate
          ? new Date(assignment.assignmentDate).toLocaleDateString("tr-TR")
          : "Belirtilmemiş",
      },
    ];
    currentY = drawSection(currentY, "ZİMMETLENEN MALZEME BİLGİLERİ", itemInfo);

    doc.font(mainFont).fontSize(9).fillColor("#444444");
    doc.text(
      "Yukarıda detayları belirtilen malzemeyi, tüm aksesuarları ile birlikte sağlam, çalışır ve eksiksiz bir şekilde teslim aldım. Bu malzemenin kullanımından ve muhafazasından sorumlu olduğumu, görevimden ayrılmam veya zimmet değişikliği durumunda aynı şekilde eksiksiz olarak iade edeceğimi kabul ve beyan ederim.",
      50,
      currentY + 20,
      { align: "justify", width: 500 }
    );

    const signatureY = doc.page.height - 150;
    doc
      .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
      .fontSize(10)
      .fillColor("#000000")
      .text("Teslim Eden", 75, signatureY);
    doc
      .font(mainFont)
      .fontSize(8)
      .fillColor("#555555")
      .text("Adı Soyadı / Unvan", 75, signatureY + 15);
    doc
      .moveTo(75, signatureY + 50)
      .lineTo(275, signatureY + 50)
      .strokeColor("#000000")
      .stroke();
    doc
      .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
      .fontSize(10)
      .fillColor("#000000")
      .text("Teslim Alan", 325, signatureY);
    doc
      .font(mainFont)
      .fontSize(8)
      .fillColor("#555555")
      .text("Adı Soyadı / İmza", 325, signatureY + 15);
    doc
      .moveTo(325, signatureY + 50)
      .lineTo(525, signatureY + 50)
      .strokeColor("#000000")
      .stroke();

    drawFooter();
    doc.end();
  } catch (error) {
    console.error("PDF oluşturma hatası (Zimmet Formu):", error);
    res.status(500).json({
      message: "PDF zimmet formu oluşturulurken bir sunucu hatası oluştu.",
      error: error.message,
    });
  }
});

// @desc    Birden çok zimmeti iade alır ve bir iade tutanağı oluşturur
// @route   PUT /api/assignments/return-multiple
// @access  Private/Admin
const returnMultipleAssignments = asyncHandler(async (req, res) => {
  const { assignmentIds } = req.body;

  if (!assignmentIds || assignmentIds.length === 0) {
    res.status(400);
    throw new Error("İade edilecek zimmet seçilmedi.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const assignmentsToReturn = await Assignment.find({
      _id: { $in: assignmentIds },
    })
      .populate("item", "name assetTag")
      .populate("personnel", "fullName")
      .session(session);

    if (assignmentsToReturn.length !== assignmentIds.length) {
      throw new Error("İade edilmek istenen zimmetlerden bazıları bulunamadı.");
    }

    // İlk zimmetin personel bilgisinin varlığını kontrol et
    if (!assignmentsToReturn[0].personnel) {
      throw new Error(
        "İade listesindeki ilk zimmetin personel bilgisi bulunamadı. Lütfen veriyi kontrol edin."
      );
    }

    const personnelId = assignmentsToReturn[0].personnel._id;
    const personnelName = assignmentsToReturn[0].personnel.fullName;

    const returnedItemsForReceipt = [];
    const itemIdsToMakeAvailable = [];

    for (const assignment of assignmentsToReturn) {
      // Personel ve Eşya bilgilerinin varlığını kontrol et
      if (!assignment.personnel) {
        throw new Error(
          `Bir zimmet kaydında personel bilgisi bulunamadı. İşlem iptal edildi.`
        );
      }
      if (!assignment.item) {
        throw new Error(
          `Bir zimmet kaydında eşya bilgisi bulunamadı. İşlem iptal edildi.`
        );
      }
      // Personel bilgisinin varlığını ve eşleşmeyi kontrol et
      if (
        !assignment.personnel ||
        !assignment.personnel._id.equals(personnelId)
      ) {
        throw new Error(
          "Toplu iade sadece aynı personele ait zimmetler için yapılabilir."
        );
      }
      if (assignment.status !== "Zimmetli") {
        throw new Error(
          `'${
            assignment.item?.name || "Bilinmeyen Eşya"
          }' zimmeti zaten iade edilmiş veya farklı bir durumda.`
        );
      }

      assignment.status = "İade Edildi";
      assignment.returnDate = new Date();
      assignment.history.push({
        user: req.user._id,
        username: req.user.username,
        changes: [{ field: "status", from: "Zimmetli", to: "İade Edildi" }],
      });

      await assignment.save({ session });

      itemIdsToMakeAvailable.push(assignment.item._id);
      returnedItemsForReceipt.push({
        item: assignment.item._id,
        assignmentId: assignment._id,
      });
    }

    // İlgili tüm eşyaların durumunu 'Boşta' olarak güncelle
    await Item.updateMany(
      { _id: { $in: itemIdsToMakeAvailable } },
      { $set: { status: "Boşta" } },
      { session }
    );

    // Yeni bir iade tutanağı kaydı oluştur
    const newReceipt = await ReturnReceipt.create(
      [
        {
          personnel: personnelId,
          returnedItems: returnedItemsForReceipt,
          processedBy: req.user._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    await logAction(
      req.user,
      "TOPLU_ZİMMET_İADE",
      `'${personnelName}' personelinden ${assignmentIds.length} adet eşya iade alındı.`
    );

    res.status(200).json({
      message: "Zimmetler başarıyla iade alındı.",
      receiptId: newReceipt[0]._id, // Yazdırma için tutanak ID'sini döndür
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400);
    throw new Error(
      error.message || "Toplu iade işlemi sırasında bir hata oluştu."
    );
  } finally {
    session.endSession();
  }
});

// @desc    Bir iade tutanağını PDF olarak yazdırır
// @route   GET /api/return-receipts/:id/print
// @access  Private
const printReturnReceipt = asyncHandler(async (req, res) => {
  try {
    const receipt = await ReturnReceipt.findById(req.params.id)
      .populate("personnel", "fullName employeeId department")
      .populate("processedBy", "personnel")
      .populate({
        path: "returnedItems",
        populate: {
          path: "item",
          select: "name assetTag serialNumber brand",
        },
      });

    if (!receipt) {
      res.status(404);
      throw new Error("İade tutanağı bulunamadı.");
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="iade_tutanagi_${sanitizeFilename(
        receipt.personnel?.fullName || "Bilinmeyen_Personel"
      )}_${receipt._id}.pdf"`
    );

    doc.pipe(res);

    let mainFont = "Helvetica";
    const fontPath = path.join(__dirname, "../assets/fonts/DejaVuSans.ttf");
    if (fs.existsSync(fontPath)) {
      doc.registerFont("DejaVu", fontPath);
      mainFont = "DejaVu";
    } else {
      console.warn("UYARI: DejaVu font dosyası bulunamadı.");
    }

    const drawHeader = () => {
      const headerY = 45;
      const logoPath = path.join(__dirname, "../assets/images/logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, headerY, { width: 100 });
      } else {
        console.warn("UYARI: Logo dosyası bulunamadı.");
      }
      doc
        .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
        .fontSize(18)
        .text("ZİMMET İADE TUTANAĞI", 50, headerY + 15, { align: "right" });
      doc.font(mainFont).fontSize(9);
      doc.text(`Belge No: ${receipt._id}`, { align: "right" });
      doc.text(
        `Tarih: ${new Date(receipt.createdAt).toLocaleDateString("tr-TR")}`,
        { align: "right" }
      );
      doc
        .moveTo(50, headerY + 60)
        .lineTo(550, headerY + 60)
        .strokeColor("#dddddd")
        .stroke();
    };

    const drawInfoTable = (y, title, data) => {
      doc
        .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
        .fontSize(11)
        .fillColor("#0056b3")
        .text(title, 50, y);
      doc
        .moveTo(50, y + 18)
        .lineTo(550, y + 18)
        .strokeColor("#0056b3")
        .stroke();
      let currentY = y + 30;
      data.forEach((item) => {
        doc
          .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
          .fontSize(9)
          .fillColor("#333333")
          .text(item.label, 70, currentY);
        doc
          .font(mainFont)
          .fontSize(10)
          .fillColor("#000000")
          .text(item.value || "-", 200, currentY);
        currentY += 20;
      });
      return currentY;
    };

    const drawItemsTable = (y, items) => {
      const tableTop = y;
      const itemLineHeight = 25;
      const col1 = 50,
        col2 = 180,
        col3 = 320,
        col4 = 450;
      doc
        .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
        .fontSize(10)
        .fillColor("#000000");
      doc.text("Eşya Adı", col1, tableTop);
      doc.text("Marka / Model", col2, tableTop);
      doc.text("Demirbaş No", col3, tableTop);
      doc.text("Seri No", col4, tableTop);
      doc
        .moveTo(col1, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .strokeColor("#cccccc")
        .stroke();
      let currentY = tableTop + 25;
      doc.font(mainFont).fontSize(9);
      items.forEach(({ item }) => {
        if (item) {
          // İade edilen eşya silinmişse bile çökmemesi için kontrol
          doc.text(item.name, col1, currentY, { width: col2 - col1 - 10 });
          doc.text(item.brand, col2, currentY, { width: col3 - col2 - 10 });
          doc.text(item.assetTag, col3, currentY, { width: col4 - col3 - 10 });
          doc.text(item.serialNumber, col4, currentY, { width: 550 - col4 });
        } else {
          doc.text("Silinmiş Eşya", col1, currentY);
        }
        currentY += itemLineHeight;
      });
      return currentY;
    };

    drawHeader();
    let currentY = 140;
    const personnelInfo = [
      { label: "Adı Soyadı", value: receipt.personnel?.fullName },
      { label: "Sicil Numarası", value: receipt.personnel?.employeeId },
      { label: "Departman", value: receipt.personnel?.department },
    ];
    currentY = drawInfoTable(
      currentY,
      "İADE EDEN PERSONEL BİLGİLERİ",
      personnelInfo
    );

    currentY += 15;
    doc
      .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
      .fontSize(11)
      .fillColor("#0056b3")
      .text("İADE EDİLEN MALZEMELER", 50, currentY);
    currentY = drawItemsTable(currentY + 25, receipt.returnedItems);

    const signatureY = doc.page.height - 150;
    doc
      .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
      .fontSize(10)
      .fillColor("#000000")
      .text("Teslim Eden", 75, signatureY);
    doc
      .font(mainFont)
      .fontSize(8)
      .fillColor("#555555")
      .text("Adı Soyadı / İmza", 75, signatureY + 15);
    doc
      .moveTo(75, signatureY + 50)
      .lineTo(275, signatureY + 50)
      .strokeColor("#000000")
      .stroke();
    doc
      .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
      .fontSize(10)
      .fillColor("#000000")
      .text("Teslim Alan", 325, signatureY);
    doc
      .font(mainFont)
      .fontSize(8)
      .fillColor("#555555")
      .text("Adı Soyadı / Unvan", 325, signatureY + 15);
    doc
      .moveTo(325, signatureY + 50)
      .lineTo(525, signatureY + 50)
      .strokeColor("#000000")
      .stroke();

    doc.end();
  } catch (error) {
    console.error("PDF oluşturma hatası (İade Tutanağı):", error);
    res.status(500).json({
      message: "PDF iade tutanağı oluşturulurken bir sunucu hatası oluştu.",
      error: error.message,
    });
  }
});

// @desc    Bir zimmeti iade olarak işaretler ve eşyayı boşa çıkarır
// @route   PUT /api/assignments/:id/return
// @access  Private/Admin
const returnAssignment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("item", "name assetTag")
      .populate("personnel", "fullName")
      .session(session);

    if (!assignment) {
      res.status(404);
      throw new Error("Zimmet kaydı bulunamadı.");
    }

    if (assignment.status === "İade Edildi") {
      res.status(400);
      throw new Error("Bu zimmet zaten iade edilmiş.");
    }

    const oldStatus = assignment.status;
    assignment.status = "İade Edildi";
    assignment.returnDate = new Date();

    // Geçmişe kaydet
    assignment.history.push({
      user: req.user._id,
      username: req.user.username,
      changes: [
        { field: "status", from: oldStatus, to: "İade Edildi" },
        { field: "returnDate", from: null, to: assignment.returnDate },
      ],
    });

    await assignment.save({ session });

    // İlgili eşyanın durumunu 'Boşta' olarak güncelle
    await Item.findByIdAndUpdate(
      assignment.item._id,
      { status: "Boşta" },
      { session }
    );

    await session.commitTransaction();

    await logAction(
      req.user,
      "ZİMMET_İADE_EDİLDİ",
      `'${assignment.personnel.fullName}' personeline ait '${assignment.item.name}' (Demirbaş No: ${assignment.item.assetTag}) zimmeti iade alındı.`
    );

    res.json({ message: "Zimmet başarıyla iade edildi." });
  } catch (error) {
    await session.abortTransaction();
    res.status(400);
    throw new Error(error.message || "İade işlemi sırasında bir hata oluştu.");
  } finally {
    session.endSession();
  }
});

// @desc    Birden çok zimmet kaydı için toplu bir PDF formu oluşturur
// @route   POST /api/assignments/print-batch
// @access  Private
const printBatchAssignmentForm = asyncHandler(async (req, res) => {
  const { assignmentIds } = req.body;

  if (!assignmentIds || assignmentIds.length === 0) {
    res.status(400);
    throw new Error("Yazdırılacak zimmet ID'leri bulunamadı.");
  }

  try {
    const assignments = await Assignment.find({ _id: { $in: assignmentIds } })
      .populate("item")
      .populate("personnel", "fullName employeeId department position")
      .populate("company", "name");

    if (assignments.length === 0) {
      res.status(404);
      throw new Error("Zimmet kayıtları bulunamadı.");
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="toplu_zimmet_formu.pdf"` // Dosya adını daha genel hale getiriyoruz
    );

    doc.pipe(res);

    let mainFont = "Helvetica";
    const fontPath = path.join(__dirname, "../assets/fonts/DejaVuSans.ttf");
    if (fs.existsSync(fontPath)) {
      doc.registerFont("DejaVu", fontPath);
      mainFont = "DejaVu";
    }

    // Her bir zimmet için ayrı bir sayfa oluştur
    assignments.forEach((assignment, index) => {
      if (index > 0) {
        doc.addPage();
      }

      const { personnel, item, company } = assignment;

      // Başlık
      doc
        .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
        .fontSize(18)
        .text("ZİMMET TESLİM TUTANAĞI", { align: "center" });
      doc.moveDown();

      // Personel Bilgileri
      doc
        .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
        .fontSize(12)
        .text("Personel Bilgileri", { underline: true });
      doc.moveDown(0.5);
      doc
        .font(mainFont)
        .fontSize(10)
        .text(`Adı Soyadı: ${personnel ? personnel.fullName : "Bilinmiyor"}`)
        .text(`Sicil No: ${personnel ? personnel.employeeId : "Bilinmiyor"}`)
        .text(`Departman: ${personnel ? personnel.department : "Bilinmiyor"}`)
        .text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`);
      doc.moveDown();

      // Eşya Tablosu Başlıkları
      const tableTop = doc.y;
      const col1 = 50,
        col2 = 200,
        col3 = 350,
        col4 = 450;
      doc
        .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
        .fontSize(10);
      doc.text("Eşya Adı", col1, tableTop);
      doc.text("Marka", col2, tableTop);
      doc.text("Demirbaş No", col3, tableTop);
      doc.text("Seri No", col4, tableTop);
      doc
        .moveTo(col1, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();
      doc.moveDown();

      // Eşya Bilgisi
      doc.font(mainFont).fontSize(9);
      doc.text(item ? item.name : "-", col1, doc.y, {
        width: col2 - col1 - 10,
      });
      doc.text(item ? item.brand : "-", col2, doc.y, {
        width: col3 - col2 - 10,
      });
      doc.text(item ? item.assetTag : "-", col3, doc.y, {
        width: col4 - col3 - 10,
      });
      doc.text(item ? item.serialNumber : "-", col4, doc.y);
      doc.moveDown(2);

      // Teslim Metni
      doc.font(mainFont).fontSize(9).fillColor("#444444");
      doc.text(
        "Yukarıda detayları belirtilen malzemeyi, tüm aksesuarları ile birlikte sağlam, çalışır ve eksiksiz bir şekilde teslim aldım. Bu malzemenin kullanımından ve muhafazasından sorumlu olduğumu, görevimden ayrılmam veya zimmet değişikliği durumunda aynı şekilde eksiksiz olarak iade edeceğimi kabul ve beyan ederim.",
        50,
        doc.y,
        { align: "justify", width: 500 }
      );

      // İmza Alanları
      const signatureY = doc.page.height - 150;
      doc
        .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
        .fontSize(10)
        .fillColor("#000000")
        .text("Teslim Eden", 75, signatureY);
      doc
        .font(mainFont)
        .fontSize(8)
        .fillColor("#555555")
        .text("Adı Soyadı / Unvan", 75, signatureY + 15);
      doc
        .moveTo(75, signatureY + 50)
        .lineTo(275, signatureY + 50)
        .strokeColor("#000000")
        .stroke();

      doc
        .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
        .fontSize(10)
        .fillColor("#000000")
        .text("Teslim Alan", 325, signatureY);
      doc
        .font(mainFont)
        .fontSize(8)
        .fillColor("#555555")
        .text("Adı Soyadı / İmza", 325, signatureY + 15);
      doc
        .moveTo(325, signatureY + 50)
        .lineTo(525, signatureY + 50)
        .strokeColor("#000000")
        .stroke();

      // Footer (Alt Bilgi)
      const pageHeight = doc.page.height;
      doc
        .fontSize(8)
        .font(mainFont)
        .fillColor("#999999")
        .text(
          `Bu belge Asseta Varlık Yönetim Sistemi tarafından oluşturulmuştur.`,
          50,
          pageHeight - 40,
          { align: "center", lineBreak: false }
        );
    });

    doc.end();
  } catch (error) {
    console.error("Toplu PDF oluşturma hatası:", error);
    res.status(500).json({
      message: "Toplu zimmet formu oluşturulurken bir hata oluştu.",
      error: error.message,
    });
  }
});

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentsByPersonnel,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getPendingGroupedAssignments,
  printAssignmentForm, // Yeni fonksiyonu export et
  returnAssignment,
  returnMultipleAssignments, // Yeni fonksiyonu export et
  printReturnReceipt, // Yeni fonksiyonu export et
  printBatchAssignmentForm, // Yeni toplu yazdırma fonksiyonunu export et
};
