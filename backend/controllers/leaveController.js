const asyncHandler = require("express-async-handler");
const Leave = require("../models/leaveModel");
const logAction = require("../utils/auditLogger");
const Personnel = require("../models/personnelModel");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

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

// @desc    Create a new leave request
// @route   POST /api/leaves
// @access  Private (Any logged-in user)
const createLeaveRequest = asyncHandler(async (req, res) => {
  const { personnelId, leaveType, startDate, endDate, reason, formPath } =
    req.body;
  const { user } = req;

  if (!leaveType || !startDate || !endDate || !reason) {
    res.status(400);
    throw new Error("Lütfen tüm alanları doldurun.");
  }

  let targetPersonnelId;

  // Eğer bir personel ID'si gönderildiyse ve kullanıcı admin ise, o personel adına işlem yap.
  if (personnelId && (user.role === "admin" || user.role === "developer")) {
    targetPersonnelId = personnelId;
  } else {
    // Değilse, kullanıcı kendi adına talep oluşturur.
    targetPersonnelId = user.personnel;
  }

  const leave = await Leave.create({
    personnel: targetPersonnelId,
    leaveType,
    startDate,
    endDate,
    reason,
    formPath, // Yüklü dosyanın yolunu kaydet
  });

  await logAction(
    user,
    "İZİN_TALEBİ_OLUŞTURULDU",
    `Kullanıcı ${leaveType} türünde yeni bir izin talebi oluşturdu.`
  );

  res.status(201).json(leave);
});

// @desc    Get leave requests for the logged-in user
// @route   GET /api/leaves/my-leaves
// @access  Private
const getMyLeaveRequests = asyncHandler(async (req, res) => {
  const leaves = await Leave.find({ personnel: req.user.personnel }).sort({
    createdAt: -1,
  });
  res.json(leaves);
});

// @desc    Get all leave requests (for Admin/HR)
// @route   GET /api/leaves
// @access  Private/Admin
const getAllLeaveRequests = asyncHandler(async (req, res) => {
  const { personnelId } = req.query;
  let filter = {};

  if (personnelId) {
    filter.personnel = personnelId;
  }

  const leaves = await Leave.find(filter)
    .populate("personnel", "fullName employeeId")
    .sort({ createdAt: -1 });
  res.json(leaves);
});

// @desc    Update leave request status (Approve/Reject)
// @route   PUT /api/leaves/:id/status
// @access  Private/Admin
const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  if (!status || (status === "Reddedildi" && !rejectionReason)) {
    res.status(400);
    throw new Error(
      "Geçersiz veri. Durum ve red nedeni (gerekirse) zorunludur."
    );
  }

  const leave = await Leave.findById(req.params.id).populate(
    "personnel",
    "fullName"
  );

  if (!leave) {
    res.status(404);
    throw new Error("İzin talebi bulunamadı.");
  }

  leave.status = status;
  leave.approvedBy = req.user._id;
  if (status === "Reddedildi") {
    leave.rejectionReason = rejectionReason;
  }

  const updatedLeave = await leave.save();

  await logAction(
    req.user,
    `İZİN_TALEBİ_${status.toUpperCase()}`,
    `'${leave.personnel.fullName}' personeline ait izin talebi '${status}' olarak güncellendi.`
  );

  // TODO: Personele e-posta/bildirim gönder

  res.json(updatedLeave);
});

// @desc    Generate a printable leave request form
// @route   POST /api/leaves/print-form
// @access  Private
const printLeaveForm = asyncHandler(async (req, res) => {
  const { personnelId, leaveType, startDate, endDate, reason } = req.body;
  const { user } = req;

  // Formu dolduracak personel bilgisini al
  let targetPersonnel;
  if (personnelId) {
    targetPersonnel = await Personnel.findById(personnelId);
  } else {
    targetPersonnel = await Personnel.findById(user.personnel);
  }

  if (!targetPersonnel) {
    res.status(404);
    throw new Error("Personel bilgisi bulunamadı.");
  }

  try {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="izin_talep_formu_${sanitizeFilename(
        targetPersonnel.fullName
      )}.pdf"`
    );

    doc.pipe(res);

    // Türkçe karakter desteği için fontu ayarla
    let mainFont = "Helvetica";
    const fontPath = path.join(__dirname, "../assets/fonts/DejaVuSans.ttf");
    if (fs.existsSync(fontPath)) {
      doc.registerFont("DejaVu", fontPath);
      mainFont = "DejaVu";
    }

    // --- PDF İçerik Çizimi ---

    // Başlık
    const headerY = 45;
    const logoPath = path.join(__dirname, "../assets/images/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, headerY, { width: 100 });
    }
    doc
      .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
      .fontSize(18)
      .text("PERSONEL İZİN TALEP FORMU", 50, headerY + 15, { align: "right" });
    doc.font(mainFont).fontSize(9);
    doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, {
      align: "right",
    });
    doc
      .moveTo(50, headerY + 60)
      .lineTo(550, headerY + 60)
      .strokeColor("#dddddd")
      .stroke();

    // Yardımcı Fonksiyonlar
    const drawTableRow = (y, label, value) => {
      doc
        .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
        .fontSize(10)
        .fillColor("#333333")
        .text(label, 70, y);
      doc
        .font(mainFont)
        .fontSize(10)
        .fillColor("#000000")
        .text(value || "-", 250, y);
    };

    const drawSection = (y, title, data) => {
      doc
        .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
        .fontSize(12)
        .fillColor("#0056b3")
        .text(title, 50, y);
      doc
        .moveTo(50, y + 20)
        .lineTo(550, y + 20)
        .strokeColor("#0056b3")
        .stroke();
      let currentY = y + 35;
      data.forEach((item) => {
        drawTableRow(currentY, item.label, item.value);
        currentY += 25;
      });
      return currentY;
    };

    // Bölümler
    let currentY = 140;
    const personnelInfo = [
      { label: "Adı Soyadı", value: targetPersonnel.fullName },
      { label: "Sicil Numarası", value: targetPersonnel.employeeId },
      { label: "Departman", value: targetPersonnel.jobInfo?.department },
      { label: "Görevi / Unvanı", value: targetPersonnel.jobInfo?.position },
    ];
    currentY = drawSection(currentY, "TALEP EDEN PERSONEL", personnelInfo);

    currentY += 20;
    const leaveInfo = [
      { label: "İzin Türü", value: leaveType }, // Bu değer formdan geliyor, Türkçe karakter içerebilir
      {
        label: "İzin Başlangıç Tarihi",
        value: new Date(startDate).toLocaleDateString("tr-TR"),
      },
      {
        label: "İşe Başlama Tarihi",
        value: new Date(endDate).toLocaleDateString("tr-TR"),
      },
      { label: "Açıklama", value: reason }, // Bu değer formdan geliyor, Türkçe karakter içerebilir
    ];
    currentY = drawSection(currentY, "İZİN BİLGİLERİ", leaveInfo);

    // İmza Alanları
    const signatureY = doc.page.height - 200;
    doc
      .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
      .fontSize(10)
      .fillColor("#000000")
      .text("Talep Eden Personel", 75, signatureY, { align: "center" });
    doc
      .font(mainFont)
      .fontSize(8)
      .fillColor("#555555")
      .text("Adı Soyadı / İmza", 75, signatureY + 15, { align: "center" });

    doc
      .font(mainFont === "DejaVu" ? "DejaVu" : "Helvetica-Bold")
      .fontSize(10)
      .fillColor("#000000")
      .text("Onaylayan Yönetici", 325, signatureY, { align: "center" });
    doc
      .font(mainFont)
      .fontSize(8)
      .fillColor("#555555")
      .text("Adı Soyadı / İmza", 325, signatureY + 15, { align: "center" });

    doc.end();
  } catch (error) {
    console.error("PDF oluşturma hatası (İzin Formu):", error);
    res.status(500).json({
      message: "PDF izin formu oluşturulurken bir sunucu hatası oluştu.",
      error: error.message,
    });
  }
});

module.exports = {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveStatus,
  printLeaveForm,
};
