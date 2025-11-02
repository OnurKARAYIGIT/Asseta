const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose"); // YENİ: Mongoose'u import et
const PayrollPeriod = require("../models/payrollPeriodModel");
const Personnel = require("../models/personnelModel");
const PayrollRecord = require("../models/payrollRecordModel");
const SalaryComponent = require("../models/salaryComponent");
const { calculateLegalDeductions } = require("../utils/payrollCalculator");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

// Dosya adlarındaki Türkçe karakterleri ve geçersiz karakterleri temizlemek için yardımcı fonksiyon
const sanitizeFilename = (name) => {
  if (!name) return "";
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
    .replace(/[\s/]/g, "_"); // Boşlukları ve / karakterini alt çizgi ile değiştir
};

// @desc    Get all payroll periods
// @route   GET /api/payroll/periods
// @access  Private/Admin
const getPayrollPeriods = asyncHandler(async (req, res) => {
  const { company } = req.query;

  const pipeline = [];

  // Eğer bir şirket filtresi varsa, pipeline'ın başına $match ekle
  if (company && mongoose.Types.ObjectId.isValid(company)) {
    pipeline.push({
      $match: { company: new mongoose.Types.ObjectId(company) },
    });
  }

  // Her döneme ait bordro sayısını da getirmek için aggregation kullanıyoruz.
  pipeline.push(
    { $sort: { year: -1, month: -1 } },
    {
      $lookup: {
        from: "locations", // Şirketler 'locations' koleksiyonunda tutuluyor
        localField: "company",
        foreignField: "_id",
        as: "companyInfo",
      },
    },
    { $unwind: { path: "$companyInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "payrollrecords", // Bordro kayıtları koleksiyonu
        localField: "_id",
        foreignField: "payrollPeriod",
        as: "payrolls",
      },
    },
    {
      $addFields: {
        payrollCount: { $size: "$payrolls" }, // Bordro sayısını hesapla
        company: { name: "$companyInfo.name" }, // Frontend ile uyumlu hale getir
      },
    },
    { $project: { payrolls: 0, companyInfo: 0 } } // Gereksiz alanları kaldır
  );

  const periods = await PayrollPeriod.aggregate(pipeline);
  res.json(periods);
});

// @desc    Create a new payroll period
// @route   POST /api/payroll/periods
// @access  Private/Admin
const createPayrollPeriod = asyncHandler(async (req, res) => {
  const { year, month, company } = req.body;

  const monthNames = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  const companyDoc = await Location.findById(company).select("name");
  if (!companyDoc) {
    res.status(404);
    throw new Error("İlişkili şirket bulunamadı.");
  }

  const name = `${monthNames[month - 1]} ${year} - ${companyDoc.name}`;

  const periodExists = await PayrollPeriod.findOne({ name, company });

  if (periodExists) {
    res.status(400);
    throw new Error("Bu bordro dönemi zaten mevcut.");
  }

  const period = await PayrollPeriod.create({
    name,
    year,
    month,
    company,
  });

  res.status(201).json(period);
});

// @desc    Get a single payroll period with personnel and their payroll status
// @route   GET /api/payroll/periods/:id
// @access  Private/Admin
const getPayrollPeriodById = asyncHandler(async (req, res) => {
  const period = await PayrollPeriod.findById(req.params.id).populate(
    "company",
    "name"
  );

  if (!period) {
    res.status(404);
    throw new Error("Bordro dönemi bulunamadı.");
  }

  // Şirket bilgisi yoksa, hata fırlatmak yerine boş bir personel listesi döndür.
  if (!period.company) {
    return res.json({ period, personnel: [] });
  }

  const { payrollStatus } = req.query;

  // Sadece bu dönemin şirketine ait aktif personelleri getir
  const allPersonnel = await Personnel.find({
    isActive: true,
    company: period.company._id,
  }).select(
    "fullName employeeId jobInfo.department jobInfo.position salaryInfo"
  ); // Maaş bilgisi de gerekebilir

  // Bu döneme ait mevcut bordro kayıtlarını getir
  const existingPayrolls = await PayrollRecord.find({
    payrollPeriod: period._id,
  }).select("personnel status");

  // Mevcut bordroları kolay arama için bir map'e dönüştür
  const payrollMap = new Map(
    existingPayrolls.map((p) => [p.personnel.toString(), p.status])
  );

  // Personel listesini, bordro durumlarıyla birleştirerek hazırla
  let personnelWithStatus = allPersonnel.map((p) => ({
    ...p.toObject(),
    payrollStatus: payrollMap.get(p._id.toString()) || "Hesaplanmadı",
  }));

  // Eğer bir durum filtresi varsa, sunucu tarafında filtrele
  if (
    payrollStatus &&
    payrollStatus !== "all" &&
    payrollStatus !== "Tüm Durumlar"
  ) {
    personnelWithStatus = personnelWithStatus.filter(
      // Bu satırda bir değişiklik yok, sadece bağlam için gösteriliyor
      (p) => p.payrollStatus === payrollStatus
    );
  }

  res.json({
    period,
    personnel: personnelWithStatus,
  });
});

// @desc    Generate all payroll records for a given period
// @route   POST /api/payroll/periods/:id/generate
// @access  Private/Admin
const generatePayrollsForPeriod = asyncHandler(async (req, res) => {
  const periodId = req.params.id;
  const period = await PayrollPeriod.findById(periodId);

  if (!period) {
    res.status(404);
    throw new Error("Bordro dönemi bulunamadı.");
  }

  if (period.status !== "Açık") {
    res.status(400);
    throw new Error(
      `Bu dönem "${period.status}" durumunda. Bordro oluşturulamaz.`
    );
  }

  // Dönem durumunu "İşleniyor" olarak güncelle
  period.status = "İşleniyor";
  await period.save();

  const activePersonnel = await Personnel.find({
    isActive: true,
    company: period.company, // Sadece dönemin şirketine ait personelleri al
  });
  const allComponents = await SalaryComponent.find({
    personnel: { $in: activePersonnel.map((p) => p._id) },
  });

  const operations = activePersonnel.map((personnel) => {
    const grossSalary = personnel.salaryInfo?.grossSalary || 0;
    const currency = personnel.salaryInfo?.currency || "TRY";

    const personnelComponents = allComponents.filter(
      (c) => c.personnel.toString() === personnel._id.toString()
    );

    const earnings = personnelComponents.filter((c) => c.type === "Kazanç");
    const deductions = personnelComponents.filter((c) => c.type === "Kesinti");

    const totalEarningsAmount = earnings.reduce((sum, c) => sum + c.amount, 0);
    const totalDeductionsAmount = deductions.reduce(
      (sum, c) => sum + c.amount,
      0
    );

    const totalGross = grossSalary + totalEarningsAmount;

    // Yasal kesintileri ve net maaşı hesapla
    const legalDeductions = calculateLegalDeductions(totalGross);

    // Nihai net maaş: (Brüt + Kazançlar) - (Yasal Kesintiler) - (Diğer Kesintiler)
    const finalNetSalary = legalDeductions.netSalary - totalDeductionsAmount;

    return {
      updateOne: {
        filter: { payrollPeriod: periodId, personnel: personnel._id },
        update: {
          $set: {
            status: "Hesaplandı",
            company: personnel.company, // Bordro kaydına şirket bilgisini ekle
            grossSalary,
            earnings: earnings.map((e) => ({ name: e.name, amount: e.amount })),
            totalEarnings: totalGross,
            deductions: deductions.map((d) => ({
              name: d.name,
              amount: d.amount,
            })),
            totalDeductions: totalDeductionsAmount,
            ...legalDeductions,
            netSalary: finalNetSalary,
            currency,
          },
        },
        upsert: true, // Kayıt yoksa oluştur
      },
    };
  });

  if (operations.length > 0) {
    await PayrollRecord.bulkWrite(operations);
  }

  // Dönem durumunu "Kilitli" olarak güncelle
  period.status = "Kilitli";
  await period.save();

  res.status(200).json({
    message: `${operations.length} personelin bordrosu başarıyla oluşturuldu.`,
  });
});

// @desc    Get a single payroll record for a specific personnel and period
// @route   GET /api/payroll/records/find
// @access  Private/Admin
const getPayrollRecord = asyncHandler(async (req, res) => {
  const { periodId, personnelId } = req.query;

  if (!periodId || !personnelId) {
    res.status(400);
    throw new Error("Dönem ID ve Personel ID zorunludur.");
  }

  const record = await PayrollRecord.findOne({
    payrollPeriod: periodId,
    personnel: personnelId,
  }).populate("personnel", "fullName employeeId");

  if (!record) {
    // Henüz bordro oluşmamış olabilir, bu bir hata değil.
    return res.json(null);
  }

  res.json(record);
});

// @desc    Generate a printable payroll slip (payslip)
// @route   GET /api/payroll/records/:id/print
// @access  Private/Admin
const printPayrollRecord = asyncHandler(async (req, res) => {
  const record = await PayrollRecord.findById(req.params.id)
    .populate("personnel")
    .populate("payrollPeriod");

  if (!record) {
    res.status(404);
    throw new Error("Bordro kaydı bulunamadı.");
  }

  const { personnel, payrollPeriod } = record;

  try {
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="bordro_${sanitizeFilename(
        payrollPeriod.name
      )}_${sanitizeFilename(personnel.fullName)}.pdf"`
    );

    doc.pipe(res);

    // Font setup
    let mainFont = "Helvetica";
    let boldFont = "Helvetica-Bold";
    const fontPath = path.join(__dirname, "../assets/fonts/DejaVuSans.ttf");
    const boldFontPath = path.resolve(
      "./frontend/src/assets/fonts/DejaVuSans-Bold.ttf"
    );
    if (fs.existsSync(fontPath)) {
      doc.registerFont("DejaVu", fontPath);
      mainFont = "DejaVu";
      boldFont = fs.existsSync(boldFontPath)
        ? doc.registerFont("DejaVu-Bold", boldFontPath) && "DejaVu-Bold"
        : "DejaVu";
    }

    // Helper functions
    const formatCurrency = (amount) =>
      (amount || 0).toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    // --- PDF CONTENT ---

    // Header
    const logoPath = path.join(__dirname, "../assets/images/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 100 });
    }
    doc.font(boldFont).fontSize(18).text("MAAŞ BORDROSU", { align: "right" });
    doc
      .font(mainFont)
      .fontSize(12)
      .text(payrollPeriod.name, { align: "right" });
    doc.moveDown(2);

    // Personnel Info
    doc.font(boldFont).fontSize(11).text("Personel Bilgileri", 40);
    doc.lineCap("round").moveTo(40, doc.y).lineTo(555, doc.y).stroke("#ccc");
    doc.moveDown(0.5);
    doc.font(mainFont).fontSize(9);
    doc.text(`Adı Soyadı: ${personnel.fullName}`, 45);
    doc.text(`Sicil No: ${personnel.employeeId}`, 250, doc.y - 11);
    doc.text(`Departman: ${personnel.jobInfo?.department || "-"}`, 45);
    doc.text(
      `Pozisyon: ${personnel.jobInfo?.position || "-"}`,
      250,
      doc.y - 11
    );
    doc.moveDown(2);

    // Tables
    const tableTop = doc.y;
    const col1 = 45;
    const col2 = 290;
    const col3 = 450;

    const drawRow = (y, item, amount, isHeader = false) => {
      doc.font(isHeader ? boldFont : mainFont).fontSize(isHeader ? 10 : 9);
      doc.text(item, col1, y);
      doc.text(formatCurrency(amount), col3, y, { align: "right" });
    };

    // Earnings
    doc.font(boldFont).fontSize(10).text("KAZANÇLAR", col1, tableTop);
    let currentY = tableTop + 20;
    drawRow(currentY, "Brüt Maaş", record.grossSalary);
    currentY += 15;
    record.earnings.forEach((e) => {
      drawRow(currentY, e.name, e.amount);
      currentY += 15;
    });
    doc
      .lineCap("round")
      .moveTo(col1, currentY)
      .lineTo(555, currentY)
      .stroke("#eee");
    currentY += 5;
    drawRow(currentY, "Toplam Kazanç", record.totalEarnings, true);
    currentY += 30;

    // Deductions
    doc.font(boldFont).fontSize(10).text("KESİNTİLER", col1, currentY);
    currentY += 20;
    drawRow(currentY, "SGK İşçi Payı (%14)", record.sgkWorkerShare);
    currentY += 15;
    drawRow(
      currentY,
      "İşsizlik Sig. İşçi Payı (%1)",
      record.unemploymentWorkerShare
    );
    currentY += 15;
    drawRow(currentY, "Gelir Vergisi", record.incomeTax);
    currentY += 15;
    drawRow(currentY, "Damga Vergisi", record.stampDuty);
    currentY += 15;
    record.deductions.forEach((d) => {
      drawRow(currentY, d.name, d.amount);
      currentY += 15;
    });
    doc
      .lineCap("round")
      .moveTo(col1, currentY)
      .lineTo(555, currentY)
      .stroke("#eee");
    currentY += 5;
    const totalAllDeductions =
      record.totalLegalDeductions + record.totalDeductions;
    drawRow(currentY, "Toplam Kesinti", totalAllDeductions, true);
    currentY += 30;

    // Net Salary
    doc.font(boldFont).fontSize(12).fillColor("#0056b3");
    doc.text("NET ÖDENECEK TUTAR", col1, currentY);
    doc.text(
      `${formatCurrency(record.netSalary)} ${record.currency}`,
      col3,
      currentY,
      { align: "right" }
    );

    doc.end();
  } catch (error) {
    console.error("PDF Bordro oluşturma hatası:", error);
    res
      .status(500)
      .json({ message: "PDF Bordro oluşturulurken bir hata oluştu." });
  }
});

// @desc    Export bank payment list as CSV for a given period
// @route   GET /api/payroll/periods/:id/export-csv
// @access  Private/Admin
const exportBankListCsv = asyncHandler(async (req, res) => {
  const period = await PayrollPeriod.findById(req.params.id);
  if (!period) {
    res.status(404);
    throw new Error("Bordro dönemi bulunamadı.");
  }

  const records = await PayrollRecord.find({
    payrollPeriod: req.params.id,
    status: "Hesaplandı", // Sadece hesaplanmış bordroları al
  }).populate("personnel", "fullName");

  if (records.length === 0) {
    res.status(404);
    throw new Error("Bu dönem için dışa aktarılacak ödeme kaydı bulunamadı.");
  }

  // CSV başlıkları (UTF-8 BOM ile Türkçe karakter sorununu çöz)
  const header = "\uFEFFAd Soyad,Net Odenecek,Para Birimi,Aciklama\n";

  // CSV satırları
  const rows = records
    .map((record) => {
      const personnelName = record.personnel
        ? record.personnel.fullName.replace(/,/g, "")
        : "Bilinmeyen";
      const netSalary = record.netSalary.toFixed(2);
      const currency = record.currency;
      const description = `${period.name} Maas Odeme`;
      return `${personnelName},${netSalary},${currency},${description}`;
    })
    .join("\n");

  const csvData = header + rows;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="banka_odeme_listesi_${period.name.replace(
      /\s/g,
      "_"
    )}.csv"`
  );
  res.status(200).send(csvData);
});

// @desc    Get payroll records for the logged-in user
// @route   GET /api/payroll/my-records
// @access  Private
const getMyPayrollRecords = asyncHandler(async (req, res) => {
  // 'protect' middleware'i sayesinde req.user objesi mevcut.
  // User modelinde personnel alanı populate edilmiş olmalı.
  const personnelId = req.user.personnel;

  if (!personnelId) {
    res.status(400);
    throw new Error(
      "Kullanıcı bir personel ile ilişkilendirilmemiş. Bordrolar alınamıyor."
    );
  }

  const myPayrolls = await PayrollRecord.find({ personnel: personnelId })
    .populate("payrollPeriod", "name year month")
    .sort({ createdAt: -1 }); // En yeni bordro en üstte olacak şekilde sırala

  res.json(myPayrolls);
});

module.exports = {
  getPayrollPeriods,
  createPayrollPeriod,
  getPayrollPeriodById,
  generatePayrollsForPeriod,
  getPayrollRecord,
  printPayrollRecord,
  exportBankListCsv,
  getMyPayrollRecords, // Yeni fonksiyonu export et
};
