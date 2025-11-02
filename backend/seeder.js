// ===================================================================================
// ASSETA - VERİ TOHUMLAMA BETİĞİ (SEEDER)
// ===================================================================================
// Bu betik, geliştirme ve test ortamları için gerçekçi ve kapsamlı veriler oluşturur.
// Çalıştırmak için: `node backend/seeder.js`
// Verileri temizlemek için: `node backend/seeder.js -d`
// ===================================================================================

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const colors = require("colors");
const { fakerTR: faker } = require("@faker-js/faker"); // Faker kütüphanesini Türkçe yerelleştirme ile ekliyoruz

// --- Modeller ---
const User = require("./models/userModel");
const Personnel = require("./models/personnelModel");
const Item = require("./models/itemModel");
const Assignment = require("./models/assignmentModel");
const Location = require("./models/locationModel");
const AuditLog = require("./models/auditLogModel");
const AttendanceRecord = require("./models/attendanceRecordModel.js"); // YENİ: Mesai Kaydı modelini import et
const SalaryComponent = require("./models/salaryComponent.js");
const Leave = require("./models/leaveModel.js");
const PayrollPeriod = require("./models/payrollPeriodModel.js");
const PayrollRecord = require("./models/payrollRecordModel.js");
const { calculateLegalDeductions } = require("./utils/payrollCalculator.js");

// --- Konfigürasyon ---
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// --- Veritabanı Bağlantısı ---
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Bağlandı: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Hata: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
};

// --- Sabitler ve Yardımcı Fonksiyonlar ---
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const STATUS = {
  ASSIGNED: "Zimmetli",
  PENDING: "Beklemede",
  FAULTY: "Arızalı",
  SCRAPPED: "Hurda",
  RETURNED: "İade Edildi",
  AVAILABLE: "Boşta",
};

const ROLES = {
  ADMIN: "admin",
  DEVELOPER: "developer",
  USER: "user",
};

/**
 * Veritabanındaki tüm koleksiyonları temizler.
 */
const clearDatabase = async () => {
  console.log("İndeksler temizleniyor...".yellow);
  await Promise.all([
    dropCollectionIndexes(User, "Users"),
    dropCollectionIndexes(Personnel, "Personnels"),
    dropCollectionIndexes(Item, "Items"),
  ]);

  try {
    await Promise.all([
      User.deleteMany(),
      Personnel.deleteMany(),
      Item.deleteMany(),
      Assignment.deleteMany(),
      Location.deleteMany(),
      AuditLog.deleteMany(),
      AttendanceRecord.deleteMany(), // YENİ: Mesai kayıtlarını da temizle
      SalaryComponent.deleteMany(),
      Leave.deleteMany(),
      PayrollPeriod.deleteMany(),
      PayrollRecord.deleteMany(),
    ]);
    console.log("Veritabanı başarıyla temizlendi.".red.inverse);
  } catch (error) {
    console.error("Veritabanı temizlenirken hata oluştu:".red, error);
    throw error;
  }
};

/**
 * Bir koleksiyondaki mevcut indeksleri siler.
 * Bu, özellikle 'sparse' unique index'lerin doğru çalışması için gereklidir.
 */
const dropCollectionIndexes = async (model, modelName) => {
  try {
    await model.collection.dropIndexes();
    console.log(`${modelName} indeksleri temizlendi.`.yellow);
  } catch (error) {
    if (
      error.codeName !== "IndexNotFound" &&
      error.codeName !== "NamespaceNotFound"
    ) {
      console.error(`${modelName} indeksleri silinirken hata:`.red, error);
      throw error;
    }
    // İndeks bulunamazsa hata vermeden devam et.
  }
};

// ===================================================================================
// VERİ OLUŞTURMA FONKSİYONLARI
// ===================================================================================

/**
 * Konum (Lokasyon) verilerini oluşturur.
 */
const seedLocations = async () => {
  await dropCollectionIndexes(Location, "Locations");
  const createdLocations = await Location.insertMany([
    { name: "Merkez Ofis", address: "Ankara", contact: "5551112233" },
    { name: "İstanbul Şube", address: "İstanbul", contact: "5554445566" },
    { name: "İzmir Depo", address: "İzmir", contact: "5557778899" },
  ]);
  console.log("Lokasyonlar oluşturuldu.".green.inverse);
  return {
    createdLocations,
    merkezOfis: createdLocations[0],
    istanbulSube: createdLocations[1],
    izmirDepo: createdLocations[2],
  };
};

/**
 * 500 adet Personel verisi oluşturur.
 */
const seedPersonnel = async (createdLocations) => {
  // Sisteme giriş yapacak özel personeller
  const specialPersonnel = [
    {
      fullName: "Onur KARAYİĞİT",
      employeeId: "P004",
      email: "onur.karayigit@example.com",
      company: createdLocations[0]._id, // Merkez Ofis
      salaryInfo: {
        grossSalary: 45000,
        currency: "TRY",
      },
      // --- EKSİK BİLGİLER EKLENDİ ---
      personalInfo: {
        tcNo: faker.string.numeric(11),
        birthDate: faker.date.birthdate({ min: 18, max: 60, mode: "age" }),
        gender: "Erkek",
      },
      contactInfo: {
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      },
      jobInfo: {
        department: "IT",
        position: "Developer",
        employmentType: "Tam Zamanlı",
        startDate: faker.date.past({ years: 5 }),
      },
    },
    {
      fullName: "Ali Can Yılmaz",
      employeeId: "P001",
      email: "ali.yilmaz@example.com",
      company: createdLocations[0]._id, // Merkez Ofis
      salaryInfo: {
        grossSalary: 38000,
        currency: "TRY",
      },
      personalInfo: {
        tcNo: faker.string.numeric(11),
        birthDate: faker.date.birthdate({ min: 18, max: 60, mode: "age" }),
        gender: "Erkek",
      },
      contactInfo: {
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      },
      jobInfo: {
        department: "IT",
        position: "Sistem Yöneticisi",
        employmentType: "Tam Zamanlı",
        startDate: faker.date.past({ years: 4 }),
      },
    },
    {
      fullName: "Zeynep Kaya",
      employeeId: "P002",
      email: "zeynep.kaya@example.com",
      company: createdLocations[1]._id, // İstanbul Şube
      salaryInfo: {
        grossSalary: 32000,
        currency: "TRY",
      },
      personalInfo: {
        tcNo: faker.string.numeric(11),
        birthDate: faker.date.birthdate({ min: 18, max: 60, mode: "age" }),
        gender: "Kadın",
      },
      contactInfo: {
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      },
      jobInfo: {
        department: "IT",
        position: "Ağ Uzmanı",
        employmentType: "Tam Zamanlı",
        startDate: faker.date.past({ years: 3 }),
      },
    },
    {
      fullName: "Mehmet Öztürk",
      employeeId: "P003",
      email: "mehmet.ozturk@example.com",
      company: createdLocations[1]._id, // İstanbul Şube
      salaryInfo: {
        grossSalary: 28500,
        currency: "TRY",
      },
      personalInfo: {
        tcNo: faker.string.numeric(11),
        birthDate: faker.date.birthdate({ min: 18, max: 60, mode: "age" }),
        gender: "Erkek",
      },
      contactInfo: {
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      },
      jobInfo: {
        department: "Muhasebe",
        position: "Finans Uzmanı",
        employmentType: "Tam Zamanlı",
        startDate: faker.date.past({ years: 2 }),
      },
    },
    // User 2
    {
      fullName: "Ayşe Vural",
      employeeId: "P005",
      email: "ayse.vural@example.com",
      company: createdLocations[2]._id, // İzmir Depo
      salaryInfo: {
        grossSalary: 19500,
        currency: "TRY",
      },
      personalInfo: {
        tcNo: faker.string.numeric(11),
        birthDate: faker.date.birthdate({ min: 18, max: 60, mode: "age" }),
        gender: "Kadın",
      },
      contactInfo: {
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      },
      jobInfo: {
        department: "Pazarlama",
        position: "Pazarlama Uzmanı",
        employmentType: "Tam Zamanlı",
        startDate: faker.date.past({ years: 1 }),
      },
    },
  ];

  let personnelData = [...specialPersonnel];
  const departments = [
    "IT",
    "İK",
    "Muhasebe",
    "Pazarlama",
    "Satış",
    "Operasyon",
  ];
  const positions = ["Uzman", "Yönetici", "Asistan", "Müdür", "Destek"];
  const employmentTypes = ["Tam Zamanlı", "Yarı Zamanlı", "Stajyer"];
  const contractTypes = ["Belirli Süreli", "Belirsiz Süreli"];

  for (let i = specialPersonnel.length + 1; i <= 500; i++) {
    const employeeId = `P${i.toString().padStart(3, "0")}`;
    const gender = faker.person.gender();
    const newPersonnel = {
      // Faker kullanarak rastgele ve gerçekçi isimler oluşturuyoruz
      fullName: `${faker.person.firstName()} ${faker.person.lastName()}`,
      employeeId: employeeId,
      email: `personel.${i}@example.com`,
      company: getRandomElement(createdLocations)._id, // Rastgele bir şirket ata
      salaryInfo: {
        grossSalary: faker.finance.amount({ min: 17002, max: 45000, dec: 0 }),
        currency: "TRY",
      },
      // --- EKSİK BİLGİLER EKLENDİ ---
      personalInfo: {
        tcNo: faker.string.numeric(11),
        birthDate: faker.date.birthdate({ min: 18, max: 60, mode: "age" }),
        gender: gender === "male" ? "Erkek" : "Kadın",
      },
      contactInfo: {
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      },
      jobInfo: {
        department: getRandomElement(departments),
        position: getRandomElement(positions),
        employmentType: getRandomElement(employmentTypes),
        startDate: faker.date.past({ years: 10 }),
      },
      insuranceInfo: {
        sgkNo: faker.string.numeric(12),
        contractType: getRandomElement(contractTypes),
      },
    };
    personnelData.push(newPersonnel);
  }

  const createdPersonnel = await Personnel.insertMany(personnelData);

  // YENİ: İşten ayrılmış personel senaryosu oluştur
  const inactivePersonnelIds = createdPersonnel
    .slice(450, 470)
    .map((p) => p._id); // 20 personeli pasif yap
  await Personnel.updateMany(
    { _id: { $in: inactivePersonnelIds } },
    {
      $set: {
        isActive: false,
        "jobInfo.endDate": faker.date.recent({ days: 365 }),
      },
    }
  );

  console.log(`${createdPersonnel.length} personel oluşturuldu.`.green.inverse);
  return createdPersonnel;
};

/**
 * Belirlenen personeller için Kullanıcı (User) hesapları oluşturur.
 */
const seedUsers = async (createdPersonnel) => {
  // Kullanıcı hesabı oluşturulacak personelleri, veritabanından `findOne` ile sorgulayarak bul.
  // Bu, en güvenilir yöntemdir.
  const developerPersonnel = await Personnel.findOne({ employeeId: "P004" });
  const admin1Personnel = await Personnel.findOne({ employeeId: "P001" });
  const admin2Personnel = await Personnel.findOne({ employeeId: "P002" });
  const user1Personnel = await Personnel.findOne({ employeeId: "P003" });
  const user2Personnel = await Personnel.findOne({ employeeId: "P005" });

  if (
    !developerPersonnel ||
    !admin1Personnel ||
    !admin2Personnel ||
    !user1Personnel ||
    !user2Personnel
  ) {
    throw new Error(
      "Kullanıcı oluşturmak için gerekli özel personellerden biri veya birkaçı veritabanında bulunamadı. Lütfen 'seedPersonnel' fonksiyonunu ve 'employeeId'leri kontrol edin."
    );
  }

  const usersData = [
    // 1 Developer (Full Yetki)
    {
      personnel: developerPersonnel._id,
      username: developerPersonnel.employeeId,
      email: developerPersonnel.email,
      password: "123",
      role: ROLES.DEVELOPER,
      permissions: [
        "zimmetler",
        "items",
        "locations",
        "personnel-report",
        "item-report",
        "admin",
        "audit-logs",
        "users",
        "personnel",
      ],
    },
    // 2 Admin
    {
      personnel: admin1Personnel._id,
      username: admin1Personnel.employeeId,
      email: admin1Personnel.email,
      password: "123",
      role: ROLES.ADMIN,
    },
    {
      personnel: admin2Personnel._id,
      username: admin2Personnel.employeeId,
      email: admin2Personnel.email,
      password: "123",
      role: ROLES.ADMIN,
    },
    // 2 User
    {
      personnel: user1Personnel._id,
      username: user1Personnel.employeeId,
      email: user1Personnel.email,
      password: "123",
      role: ROLES.USER,
    },
    {
      personnel: user2Personnel._id,
      username: user2Personnel.employeeId,
      email: user2Personnel.email,
      password: "123",
      role: ROLES.USER,
    },
  ];

  const createdUsers = [];
  for (const userData of usersData) {
    // User.create, modeldeki pre-save hook'u sayesinde şifreyi otomatik hash'ler.
    const user = await User.create(userData);
    createdUsers.push(user);

    // İlgili Personel kaydını, oluşturulan User ID'si ile güncelle.
    await Personnel.findByIdAndUpdate(user.personnel, {
      userAccount: user._id,
    });
  }
  console.log(
    `${createdUsers.length} kullanıcı hesabı oluşturuldu.`.green.inverse
  );

  // Sonraki adımlarda kullanılacak ana kullanıcıları döndür
  return {
    developerUser: createdUsers.find((u) => u.role === ROLES.DEVELOPER),
    mainAdminUser: createdUsers.find((u) => u.username === "P001"), // İşlemleri yapacak ana admin
  };
};

/**
 * 2500 adet Eşya (Item) verisi oluşturur.
 */
const seedItems = async () => {
  const itemsToCreate = [];
  const itemTypes = {
    Laptop: { brands: ["Dell", "HP", "Apple", "Lenovo"], prefix: "LT" },
    Monitör: { brands: ["Samsung", "LG", "Dell", "ViewSonic"], prefix: "MN" },
    Telefon: { brands: ["Apple", "Samsung", "Xiaomi"], prefix: "PH" },
    Yazıcı: { brands: ["HP", "Epson", "Canon"], prefix: "PR" },
    "Network Cihazı": { brands: ["Cisco", "TP-Link", "Zyxel"], prefix: "NW" },
  };

  for (let i = 1; i <= 2500; i++) {
    const assetType = getRandomElement(Object.keys(itemTypes));
    const typeInfo = itemTypes[assetType];
    const brand = getRandomElement(typeInfo.brands);
    const assetTag = `${brand.substring(0, 1)}-${typeInfo.prefix}-${i
      .toString()
      .padStart(4, "0")}`;

    itemsToCreate.push({
      name: `${brand} ${assetType} Model-${i}`,
      assetType: assetType,
      brand: brand,
      assetTag: assetTag,
      modelYear: 2020 + Math.floor(Math.random() * 5),
      serialNumber: `SN-${assetTag}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`,
      // Yeni eklenen alanlar için rastgele veri oluştur
      cost: faker.finance.amount({ min: 500, max: 50000, dec: 2 }),
      purchaseDate: faker.date.past({ years: 4 }),
      warrantyPeriod: getRandomElement([12, 24, 36]),

      description: `Otomatik oluşturulmuş ${assetType}.`,
      // status: 'Boşta' (default)
    });
  }

  const createdItems = await Item.insertMany(itemsToCreate);
  console.log(`${createdItems.length} eşya oluşturuldu.`.green.inverse);
  return createdItems;
};

/**
 * Belirlenen kurallara göre Zimmet (Assignment) kayıtları oluşturur.
 */
const seedAssignments = async (
  createdItems,
  createdPersonnel,
  { mainAdminUser },
  { merkezOfis, istanbulSube, izmirDepo, createdLocations }
) => {
  const assignmentsToCreate = [];
  let availableItems = [...createdItems];

  // Personelleri rastgele karıştırıp gruplara ayır
  const shuffledPersonnel = [...createdPersonnel].sort(
    () => 0.5 - Math.random()
  );
  const pendingPersonnelGroup = shuffledPersonnel.slice(0, 50); // %10
  const activePersonnelGroup = shuffledPersonnel.slice(50); // %90

  // Senaryo 1: Bekleyen Zimmetler (%10'luk grup)
  console.log("1. Bekleyen zimmetler oluşturuluyor...".cyan);
  for (const personnel of pendingPersonnelGroup) {
    if (availableItems.length === 0) break;
    const item = availableItems.pop();
    assignmentsToCreate.push(
      createSampleAssignment(
        item,
        personnel,
        STATUS.PENDING,
        mainAdminUser,
        getRandomElement(createdLocations)
      )
    );
  }

  // Senaryo 2: Geçmiş ve Aktif Zimmetler (%90'lık grup)
  console.log("2. Geçmiş ve aktif zimmetler oluşturuluyor...".cyan);
  for (const personnel of activePersonnelGroup) {
    const assignmentCount = Math.floor(Math.random() * 4) + 3; // 3-6 arası zimmet
    for (let i = 0; i < assignmentCount; i++) {
      if (availableItems.length === 0) break;
      const item = availableItems.pop();

      // %60 ihtimalle geçmiş, %40 ihtimalle aktif bir zimmet oluştur
      const isPastAssignment = Math.random() > 0.4;

      if (isPastAssignment) {
        const pastStatus =
          Math.random() > 0.2 ? STATUS.RETURNED : STATUS.FAULTY;
        const pastDate = new Date(
          new Date() - Math.random() * 1000 * 60 * 60 * 24 * 365 * 2
        ); // Son 2 yıl içinde
        assignmentsToCreate.push(
          createSampleAssignment(
            item,
            personnel,
            pastStatus,
            mainAdminUser,
            getRandomElement(createdLocations),
            pastDate
          )
        );
        // İade edilen eşyayı tekrar kullanılabilir hale getirerek eşya geçmişini zenginleştir
        if (pastStatus === STATUS.RETURNED) availableItems.unshift(item);
      } else {
        assignmentsToCreate.push(
          createSampleAssignment(
            item,
            personnel,
            STATUS.ASSIGNED,
            mainAdminUser,
            getRandomElement(createdLocations)
          )
        );
      }
    }
  }

  // Senaryo 3: Kalan Eşyaların Durumlarını Ayarlama
  console.log("3. Kalan eşyaların durumları ayarlanıyor...".cyan);
  for (const item of availableItems) {
    const rand = Math.random();
    if (rand < 0.2) {
      // %20 Arızalı
      assignmentsToCreate.push(
        createSampleAssignment(
          item,
          null, // Arızalı ve hurda eşyalar bir personele zimmetli olmayabilir.
          STATUS.FAULTY,
          mainAdminUser,
          izmirDepo
        )
      );
    } else if (rand < 0.35) {
      // %15 Hurda
      assignmentsToCreate.push(
        createSampleAssignment(
          item,
          null, // Arızalı ve hurda eşyalar bir personele zimmetli olmayabilir.
          STATUS.SCRAPPED,
          mainAdminUser,
          merkezOfis
        )
      );
    }
    // Kalanlar 'Boşta' olarak kalacak, onlar için zimmet oluşturulmuyor.
  }

  await Assignment.insertMany(assignmentsToCreate);
  console.log(
    `${assignmentsToCreate.length} zimmet kaydı oluşturuldu.`.green.inverse
  );

  // Ekstra Senaryo: Yetim Kayıt Oluşturma
  console.log("4. Ekstra 'yetim kayıt' senaryosu oluşturuluyor...".yellow);
  const personnelToDelete = await Personnel.findOne({ employeeId: "P499" });
  if (personnelToDelete) {
    // Bu personele ait zimmetlerin 'personnel' alanını null yap
    await Assignment.updateMany(
      { personnel: personnelToDelete._id },
      { personnel: null }
    );
    await personnelToDelete.deleteOne();
    console.log(
      `'${personnelToDelete.fullName}' personeli silindi, zimmetleri 'yetim' bırakıldı.`
        .yellow.inverse
    );
  }
};

/**
 * Temel Denetim (Audit Log) kayıtlarını oluşturur.
 */
const seedAuditLogs = async (developerUser, mainAdminUser, itemCount) => {
  await AuditLog.create({
    user: mainAdminUser._id,
    action: "TOPLU_EŞYA_OLUŞTURMA",
    details: `Seeder tarafından ${itemCount} adet yeni varlık oluşturuldu.`,
  });
  console.log("Denetim kayıtları oluşturuldu.".green.inverse);
};

/**
 * Örnek bir zimmet objesi oluşturmak için kullanılan yardımcı fonksiyon.
 */
const createSampleAssignment = (
  item,
  personnel,
  status,
  createdBy,
  company,
  assignmentDate
) => {
  return {
    item: item._id,
    personnel: personnel ? personnel._id : null,
    company: company._id,
    // Eğer personel null ise, birim "Genel" olarak atansın.
    unit: personnel ? personnel.department : "Genel",
    status: status,
    assignmentDate:
      assignmentDate ||
      new Date(new Date() - Math.random() * 1000 * 60 * 60 * 24 * 730), // Son 2 yıl içinde
    assignmentNotes: `Otomatik oluşturulmuş ${status} durumunda zimmet.`,
    history: [
      {
        user: createdBy._id,
        username: createdBy.username,
        changes: [{ field: "status", from: "yok", to: status }],
      },
    ],
  };
};

/**
 * YENİ: Rastgele Mesai Kayıtları (AttendanceRecord) oluşturur.
 */
const seedAttendanceRecords = async (createdPersonnel) => {
  console.log("5. Rastgele mesai kayıtları oluşturuluyor...".cyan);
  const recordsToCreate = [];
  const standardWorkMinutes = 480; // 8 saat

  // Personellerin bir kısmını seçelim (herkes her gün çalışmamış olabilir)
  const workingPersonnel = createdPersonnel.slice(0, 200);

  for (const personnel of workingPersonnel) {
    // Her personel için son 30 gün içinde 5 ila 20 arası kayıt oluşturalım
    const recordCount = faker.number.int({ min: 5, max: 20 });

    for (let i = 0; i < recordCount; i++) {
      const checkInDate = faker.date.recent({ days: 30 });
      // 7 ila 10 saat arası bir çalışma süresi (dakika cinsinden)
      const workDuration = faker.number.int({ min: 420, max: 600 });
      const checkOutDate = new Date(
        checkInDate.getTime() + workDuration * 60 * 1000
      );

      let overtime = 0;
      if (workDuration > standardWorkMinutes) {
        overtime = workDuration - standardWorkMinutes;
      }

      recordsToCreate.push({
        personnel: personnel._id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        workDuration: workDuration,
        overtime: overtime,
        status: "Tamamlandı",
        notes: "Seeder tarafından otomatik oluşturuldu.",
      });
    }
  }

  await AttendanceRecord.insertMany(recordsToCreate);
  console.log(
    `${recordsToCreate.length} mesai kaydı oluşturuldu.`.green.inverse
  );
};

/**
 * YENİ: Maaş Bileşenleri (Ek Kazanç/Kesinti) oluşturur.
 */
const seedSalaryComponents = async (createdPersonnel) => {
  console.log("6. Maaş bileşenleri oluşturuluyor...".cyan);
  const componentsToCreate = [];
  // Personellerin %20'sine yol yardımı ekle
  const personnelWithRoadFee = createdPersonnel
    .slice(0, 100)
    .sort(() => 0.5 - Math.random())
    .slice(0, 20);

  for (const p of personnelWithRoadFee) {
    componentsToCreate.push({
      personnel: p._id,
      name: "Yol Yardımı",
      type: "Kazanç",
      amount: 1710.38,
    });
  }

  // Personellerin %10'una avans kesintisi ekle
  const personnelWithAdvance = createdPersonnel
    .slice(100, 200)
    .sort(() => 0.5 - Math.random())
    .slice(0, 10);

  for (const p of personnelWithAdvance) {
    componentsToCreate.push({
      personnel: p._id,
      name: "Avans Kesintisi",
      type: "Kesinti",
      amount: 2500,
    });
  }

  await SalaryComponent.insertMany(componentsToCreate);
  console.log(
    `${componentsToCreate.length} maaş bileşeni oluşturuldu.`.green.inverse
  );
};

/**
 * YENİ: İzin Talepleri (Leave) oluşturur.
 */
const seedLeaves = async (createdPersonnel, { mainAdminUser }) => {
  console.log("7. İzin talepleri oluşturuluyor...".cyan);
  const leavesToCreate = [];
  const leaveTypes = ["Yıllık İzin", "Hastalık", "Mazeret"];
  const statuses = ["Onaylandı", "Reddedildi", "Beklemede"];

  const personnelForLeaves = createdPersonnel.slice(0, 50);

  for (const p of personnelForLeaves) {
    const leaveCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < leaveCount; i++) {
      const startDate = faker.date.recent({ days: 90 });
      const endDate = new Date(
        startDate.getTime() +
          faker.number.int({ min: 1, max: 5 }) * 24 * 60 * 60 * 1000
      );
      const status = getRandomElement(statuses);

      leavesToCreate.push({
        personnel: p._id,
        leaveType: getRandomElement(leaveTypes),
        startDate,
        endDate,
        reason: `Otomatik oluşturulmuş ${status} izin talebi.`,
        status,
        approvedBy: status !== "Beklemede" ? mainAdminUser._id : null,
        rejectionReason:
          status === "Reddedildi" ? "Yetersiz bakiye." : undefined,
      });
    }
  }

  await Leave.insertMany(leavesToCreate);
  console.log(
    `${leavesToCreate.length} izin talebi oluşturuldu.`.green.inverse
  );
};

/**
 * YENİ: Bordro Dönemleri (PayrollPeriod) oluşturur.
 */
const seedPayrollPeriods = async (locationData) => {
  console.log("8. Bordro dönemleri oluşturuluyor...".cyan);
  const periodsToCreate = [
    {
      name: `Şubat 2024 - ${locationData.merkezOfis.name}`,
      year: 2024,
      month: 2,
      company: locationData.merkezOfis._id,
      status: "Kilitli",
    },
    {
      name: `Mart 2024 - ${locationData.merkezOfis.name}`,
      year: 2024,
      month: 3,
      company: locationData.merkezOfis._id,
      status: "Açık",
    },
    {
      name: `Mart 2024 - ${locationData.istanbulSube.name}`,
      year: 2024,
      month: 3,
      company: locationData.istanbulSube._id,
      status: "Açık",
    },
  ];
  await PayrollPeriod.insertMany(periodsToCreate);
  console.log(
    `${periodsToCreate.length} bordro dönemi oluşturuldu.`.green.inverse
  );
};

/**
 * YENİ: Kilitli bordro dönemi için örnek bordro kayıtları oluşturur.
 */
const seedPayrollRecordsForLockedPeriod = async () => {
  console.log("9. Kilitli dönem için bordro kayıtları oluşturuluyor...".cyan);

  const lockedPeriod = await PayrollPeriod.findOne({ status: "Kilitli" });
  if (!lockedPeriod) {
    console.log("Kilitli bordro dönemi bulunamadı, bu adım atlanıyor.".yellow);
    return;
  }

  const personnelInCompany = await Personnel.find({
    company: lockedPeriod.company,
    isActive: true,
  });

  const allComponents = await SalaryComponent.find({
    personnel: { $in: personnelInCompany.map((p) => p._id) },
  });

  const recordsToCreate = [];

  for (const personnel of personnelInCompany) {
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
    const legalDeductions = calculateLegalDeductions(totalGross);
    const finalNetSalary = legalDeductions.netSalary - totalDeductionsAmount;

    recordsToCreate.push({
      payrollPeriod: lockedPeriod._id,
      personnel: personnel._id,
      company: personnel.company,
      status: "Hesaplandı",
      grossSalary,
      earnings: earnings.map((e) => ({ name: e.name, amount: e.amount })),
      totalEarnings: totalGross,
      deductions: deductions.map((d) => ({ name: d.name, amount: d.amount })),
      totalDeductions: totalDeductionsAmount,
      ...legalDeductions,
      netSalary: finalNetSalary,
      currency,
    });
  }

  if (recordsToCreate.length > 0) {
    await PayrollRecord.insertMany(recordsToCreate);
    console.log(
      `${recordsToCreate.length} adet bordro kaydı oluşturuldu.`.green.inverse
    );
  }
};

// ===================================================================================
// ANA ÇALIŞTIRMA MANTIĞI
// ===================================================================================

/**
 * Tüm veri oluşturma adımlarını sırayla çalıştıran ana fonksiyon.
 */
const importData = async () => {
  try {
    console.log("Veri tohumlama işlemi başlıyor...".blue.bold);
    await clearDatabase();

    const locationData = await seedLocations();
    const createdPersonnel = await seedPersonnel(locationData.createdLocations);
    const userData = await seedUsers(createdPersonnel);
    const createdItems = await seedItems();
    await seedAssignments(
      createdItems,
      createdPersonnel,
      userData,
      locationData
    );
    await seedAuditLogs(
      userData.developerUser,
      userData.mainAdminUser,
      createdItems.length
    );
    await seedAttendanceRecords(createdPersonnel); // YENİ: Mesai kayıtlarını oluştur
    await seedSalaryComponents(createdPersonnel);
    await seedLeaves(createdPersonnel, userData);
    await seedPayrollPeriods(locationData);
    await seedPayrollRecordsForLockedPeriod();

    // YENİ: Yönetici atamalarını yap
    console.log("Yönetici hiyerarşisi oluşturuluyor...".cyan);
    const allPersonnel = await Personnel.find({ isActive: true }).select("_id");
    for (const p of allPersonnel) {
      // %70 ihtimalle bir yönetici ata
      if (Math.random() < 0.7) {
        const potentialManagers = allPersonnel.filter(
          (m) => m._id.toString() !== p._id.toString()
        );
        const randomManager = getRandomElement(potentialManagers);
        if (randomManager) {
          await Personnel.findByIdAndUpdate(p._id, {
            manager: randomManager._id,
          });
        }
      }
    }

    console.log("Veri başarıyla import edildi!".green.inverse);
    process.exit();
  } catch (error) {
    console.error(
      "Veri import edilirken kritik bir hata oluştu:".red.bold,
      error
    );
    process.exit(1);
  }
};

/**
 * Sadece veritabanını temizleyen fonksiyon.
 */
const destroyData = async () => {
  try {
    console.log("Veri silme işlemi başlıyor...".blue.bold);
    await clearDatabase();
    process.exit();
  } catch (error) {
    console.error("Veri silinirken kritik bir hata oluştu:".red.bold, error);
    process.exit(1);
  }
};

// Komut satırı argümanına göre hangi fonksiyonun çalışacağına karar ver
if (process.argv[2] === "-d") {
  connectDB().then(() => destroyData());
} else {
  connectDB().then(() => importData());
}
