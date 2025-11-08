const asyncHandler = require("express-async-handler");
const path = require("path"); // YENİ: Dosya yollarını işlemek için
const Application = require("../models/applicationModel");
const JobOpening = require("../models/jobOpeningModel");
const Candidate = require("../models/candidateModel");
const Interview = require("../models/interviewModel"); // YENİ: Interview modelini import et
const Personnel = require("../models/personnelModel"); // YENİ: Personnel modelini import et
const Document = require("../models/documentModel"); // YENİ: Evrak modeli
const logAction = require("../utils/auditLogger"); // YENİ: Loglama yardımcısı

// @desc    Yeni bir başvuru oluşturur
// @route   POST /api/applications
// @access  Private
const createApplication = asyncHandler(async (req, res) => {
  const { candidate, jobOpening } = req.body;

  if (!candidate || !jobOpening) {
    res.status(400);
    throw new Error("Aday ve İş İlanı ID'leri zorunludur.");
  }

  // İş ilanı ve adayın varlığını kontrol et
  const jobOpeningExists = await JobOpening.findById(jobOpening);
  const candidateExists = await Candidate.findById(candidate);

  if (!jobOpeningExists || !candidateExists) {
    res.status(404);
    throw new Error("Aday veya İş İlanı bulunamadı.");
  }

  const application = await Application.create({
    candidate,
    jobOpening,
  });

  if (application) {
    res.status(201).json({
      _id: application._id,
      candidate: application.candidate,
      jobOpening: application.jobOpening,
      status: application.status,
    });
  } else {
    res.status(400);
    throw new Error("Geçersiz başvuru verisi");
  }
});

// @desc    Tüm başvuruları listeler
// @route   GET /api/applications
// @access  Private
const getApplications = asyncHandler(async (req, res) => {
  // YENİ: Query parametrelerine göre filtreleme
  const filter = {};
  if (req.query.jobOpening) {
    filter.jobOpening = req.query.jobOpening;
  }

  const applications = await Application.find(filter) // Filtreyi uygula
    .populate("candidate", "fullName email")
    .populate("jobOpening", "title");
  res.json(applications);
});

// @desc    ID ile tek bir başvuruyu getirir
// @route   GET /api/applications/:id
// @access  Private
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate("candidate", "fullName email")
    .populate("jobOpening", "title");

  if (application) {
    res.json(application);
  } else {
    res.status(404);
    throw new Error("Başvuru bulunamadı");
  }
});

// @desc    Bir başvurunun durumunu günceller
// @route   PUT /api/applications/:id/status
// @access  Private/Admin
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error("Başvuru bulunamadı");
  }

  const { status } = req.body;

  // Gelen status değerinin geçerli bir Türkçe durum olup olmadığını kontrol et
  if (
    ![
      "Başvuru Alındı",
      "Ön Değerlendirme",
      "İK Mülakatı",
      "Teknik Mülakat",
      "Teklif",
      "İşe Alındı",
      "Reddedildi",
    ].includes(status)
  ) {
    res.status(400);
    throw new Error("Geçersiz başvuru durumu");
  }

  const previousStatus = application.status; // Mevcut durumu kaydet

  // Başvuru geçmişini kaydet
  application.history.push({
    status: previousStatus, // Değişiklikten önceki durumu kaydet
    changedBy: req.user._id, // Kullanıcı bilgisini auth middleware'den alıyoruz
  });

  application.status = status;
  const updatedApplication = await application.save();

  // --- OTOMASYON BAŞLANGICI ---
  // Eğer durum "İşe Alındı" olarak ayarlandıysa, ilgili işlemleri yap
  if (status === "İşe Alındı") {
    // 1. İlgili iş ilanını "Dolduruldu" olarak güncelle. (KULLANICI İSTEĞİ ÜZERİNE DEVRE DIŞI BIRAKILDI)
    // await JobOpening.findByIdAndUpdate(application.jobOpening, {
    //   status: "Dolduruldu",
    // });

    // 2. Aday ve iş ilanı bilgilerini al.
    const candidate = await Candidate.findById(application.candidate);
    const jobOpening = await JobOpening.findById(application.jobOpening);

    // 3. Adaydan yeni bir personel kaydı oluştur.
    //    Burada temel bilgileri alıyoruz, diğer bilgiler daha sonra İK tarafından doldurulabilir.
    if (candidate && jobOpening) {
      // Bu e-posta veya sicil numarası ile zaten bir personel olup olmadığını kontrol et
      const existingPersonnel = await Personnel.findOne({
        email: candidate.email,
      });
      if (!existingPersonnel) {
        // YENİ: Otomatik olarak yeni bir sicil numarası oluştur.
        // Son personeli sicil numarasına göre tersten sıralayarak bul.
        const lastPersonnel = await Personnel.findOne().sort({
          employeeId: -1,
        });
        let newEmployeeId = "P001"; // Varsayılan ilk numara
        if (lastPersonnel && lastPersonnel.employeeId) {
          const lastIdNumber = parseInt(
            lastPersonnel.employeeId.substring(1),
            10
          );
          newEmployeeId = `P${(lastIdNumber + 1).toString().padStart(3, "0")}`;
        }

        const newPersonnel = await Personnel.create({
          fullName: candidate.fullName,
          email: candidate.email,
          employeeId: newEmployeeId, // Oluşturulan yeni sicil numarasını ata
          company: jobOpening.company, // İlanın açıldığı şirket
          contactInfo: {
            phone: candidate.phone,
          },
          jobInfo: {
            department: jobOpening.department,
            position: jobOpening.title,
            startDate: new Date(), // İşe alındığı tarih
          },
        });

        // YENİ: İşlem geçmişine log kaydı ekle
        await logAction(
          req.user,
          "PERSONEL_OLUŞTURULDU",
          `'${newPersonnel.fullName}' adlı personel, işe alım süreciyle otomatik olarak oluşturuldu.`,
          newPersonnel._id // Logu doğrudan yeni personele bağla
        );

        // YENİ: Adayın CV'sini ve diğer belgelerini personel evraklarına aktar
        if (candidate.resumePaths && candidate.resumePaths.length > 0) {
          const documentsToCreate = candidate.resumePaths.map((filePath) => ({
            personnel: newPersonnel._id,
            documentType: "Özgeçmiş", // Veya "Başvuru Belgesi"
            fileName: path.basename(filePath), // Dosya adını yoldan çıkar
            filePath: filePath,
            createdBy: req.user._id, // YENİ: İşlemi yapan kullanıcıyı ekle
          }));

          const createdDocuments = await Document.insertMany(documentsToCreate);

          // Oluşturulan evrakların ID'lerini personel kaydına ekle
          newPersonnel.documents.push(
            ...createdDocuments.map((doc) => doc._id)
          );
          await newPersonnel.save();
        }
      }
    }
  }
  // --- OTOMASYON SONU ---

  res.json({
    _id: updatedApplication._id,
    candidate: updatedApplication.candidate,
    jobOpening: updatedApplication.jobOpening,
    status: updatedApplication.status,
  });
});

// @desc    Bir başvuruyu siler
// @route   DELETE /api/applications/:id
// @access  Private/Admin
const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (application) {
    await application.deleteOne();
    res.json({ message: "Başvuru silindi" });
  } else {
    res.status(404);
    throw new Error("Başvuru bulunamadı");
  }
});

// @desc    Belirli bir başvuruya ait tüm mülakatları listeler
// @route   GET /api/applications/:appId/interviews
// @access  Private
const getInterviewsForApplication = asyncHandler(async (req, res) => {
  const interviews = await Interview.find({ application: req.params.appId })
    .populate("interviewers", "fullName") // Görüşmecilerin sadece adını getir
    .sort({ scheduledDate: 1 });

  res.json(interviews);
});

// @desc    Belirli bir iş ilanına ait tüm başvuruları getirir
// @route   GET /api/applications/job/:jobId
// @access  Private
const getApplicationsByJobOpening = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const applications = await Application.find({ jobOpening: jobId })
    .populate({
      path: "candidate",
      select: "fullName email source resumePaths tags", // YENİ: 'tags' alanını ekledik
    })
    .lean() // YENİ: Daha performanslı sorgular için lean() kullanıyoruz
    .sort({ createdAt: -1 });

  // Not: `find` metodu bir şey bulamazsa boş bir dizi [] döndürür, hata vermez.
  // Bu yüzden 404 kontrolü yerine doğrudan sonucu döndürmek daha doğrudur.
  res.status(200).json(applications);
});

// @desc    Bir başvuru için iş teklifi oluşturur veya günceller
// @route   POST /api/applications/:id/offer
// @access  Private/Admin
const makeOffer = asyncHandler(async (req, res) => {
  const { offeredSalary, currency, startDate, notes } = req.body;
  const application = await Application.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error("Başvuru bulunamadı.");
  }

  // Teklif bilgilerini oluştur/güncelle
  application.offer = {
    offeredSalary,
    currency,
    startDate,
    notes,
    status: "Beklemede", // Teklif yapıldığında varsayılan durum
  };

  const previousStatus = application.status;
  // Başvurunun ana durumunu "Teklif" olarak ayarla
  application.status = "Teklif";

  // Geçmişe kaydet
  application.history.push({
    status: previousStatus,
    changedBy: req.user._id,
  });

  const updatedApplication = await application.save();
  res.status(200).json(updatedApplication);
});

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getInterviewsForApplication, // YENİ: Fonksiyonu export et
  getApplicationsByJobOpening, // Yeni fonksiyonu export et
  makeOffer, // YENİ: Teklif fonksiyonunu export et
};
