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
const seedPersonnel = async () => {
  // Sisteme giriş yapacak özel personeller
  const specialPersonnel = [
    {
      fullName: "Onur KARAYİĞİT",
      employeeId: "P004",
      department: "IT",
      position: "Developer",
      email: "onur.karayigit@example.com",
    },
    {
      fullName: "Ali Can Yılmaz",
      employeeId: "P001",
      department: "IT",
      position: "Sistem Yöneticisi",
      email: "ali.yilmaz@example.com",
    },
    {
      fullName: "Zeynep Kaya",
      employeeId: "P002",
      department: "IT",
      position: "Ağ Uzmanı",
      email: "zeynep.kaya@example.com",
    },
    {
      fullName: "Mehmet Öztürk",
      employeeId: "P003",
      department: "Muhasebe",
      position: "Finans Uzmanı",
      email: "mehmet.ozturk@example.com",
    },
    // User 2
    {
      fullName: "Ayşe Vural",
      employeeId: "P005",
      department: "Pazarlama",
      position: "Pazarlama Uzmanı",
      email: "ayse.vural@example.com",
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

  for (let i = specialPersonnel.length + 1; i <= 500; i++) {
    const employeeId = `P${i.toString().padStart(3, "0")}`;
    const newPersonnel = {
      // Faker kullanarak rastgele ve gerçekçi isimler oluşturuyoruz
      fullName: `${faker.person.firstName()} ${faker.person.lastName()}`,
      employeeId: employeeId,
      department: getRandomElement(departments),
      position: getRandomElement(positions),
      email: `personel.${i}@example.com`,
    };
    personnelData.push(newPersonnel);
  }

  const createdPersonnel = await Personnel.insertMany(personnelData);
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
          getRandomElement(createdPersonnel),
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
          getRandomElement(createdPersonnel),
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
    personnel: personnel._id,
    company: company._id,
    unit: personnel.department,
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
    const createdPersonnel = await seedPersonnel();
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
