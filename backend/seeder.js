const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const colors = require("colors");
const { faker } = require("@faker-js/faker/locale/tr"); // Türkçe veriler için
const User = require("./models/userModel");
const Location = require("./models/locationModel");
const Item = require("./models/itemModel");
const Assignment = require("./models/assignmentModel");
const connectDB = require("./config/db");
const bcrypt = require("bcryptjs");
const { subYears, subDays } = require("date-fns");

dotenv.config({ path: path.resolve(__dirname, "./.env") });

connectDB();

const importData = async () => {
  try {
    // Önceki tüm verileri temizle
    await Assignment.deleteMany();
    await Item.deleteMany();
    await Location.deleteMany();
    await User.deleteMany();

    // --- 1. KULLANICILARI OLUŞTUR ---
    const { createdUsers, personnelWithIds } = await createUsersAndPersonnel();
    console.log("Kullanıcılar ve sanal personeller oluşturuldu.".green);

    // --- 2. KONUMLARI OLUŞTUR ---
    const createdLocations = await createLocations();
    console.log("Konumlar oluşturuldu.".green);

    // --- 3. EŞYALARI OLUŞTUR ---
    const createdItems = await createItems();
    console.log("Eşyalar oluşturuldu.".green);

    // --- 4. ZİMMETLERİ OLUŞTUR ---
    await createAssignments(
      personnelWithIds,
      createdItems,
      createdLocations,
      createdUsers[0] // Logları oluşturacak kullanıcı (örneğin, ilk developer)
    );
    console.log("Zimmetler oluşturuldu.".green);

    console.log("Test verileri başarıyla yüklendi!".green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

/**
 * Temel ve senaryo kullanıcılarını oluşturur.
 * Sanal personeller için benzersiz ID'ler üretir.
 */
const createUsersAndPersonnel = async () => {
  console.log("Kullanıcılar ve sanal personeller hazırlanıyor...".cyan);
  const salt = await bcrypt.genSalt(10);

  const baseUsers = [
    {
      username: "Onur KARAYİĞİT",
      email: "onur.karayigit@example.com",
      phone: "05551112233",
      position: "Yazılım Geliştirici",
      role: "developer",
      permissions: [
        "zimmetler",
        "personnel-report",
        "locations",
        "items",
        "audit-logs",
        "admin",
      ],
    },
    {
      username: "Admin User 1",
      email: "admin@example.com",
      phone: "05552223344",
      position: "Sistem Yöneticisi",
      role: "admin",
      permissions: [
        "zimmetler",
        "personnel-report",
        "locations",
        "items",
        "audit-logs",
        "admin",
      ],
    },
    {
      username: "Standard User 1",
      email: "user1@example.com",
      phone: "05556667788",
      position: "Personel",
      role: "user",
      permissions: [],
    },
  ];

  const scenarioPersonnelNames = [
    "Sibel Yılmaz",
    "Sibel Kaya",
    "Ahmet Çelik",
    "Ahmet Demir",
    "Mehmet Öztürk",
    "Mehmet Öztürk", // Aynı isimli 2 kişi
    "Ayşe Yılmaz",
    "Ayşe Yılmaz",
    "Ali Veli",
    "Arıza Sorumlusu",
  ];

  // Benzersiz isimlerden kullanıcı oluştur, aynı isimli personeller için tek bir kullanıcı profili yeterli.
  const uniqueScenarioNames = [...new Set(scenarioPersonnelNames)];
  const scenarioUsers = uniqueScenarioNames.map((name) => ({
    username: name,
    email: faker.internet
      .email({ firstName: name.split(" ")[0], lastName: name.split(" ")[1] })
      .toLowerCase(),
    phone: faker.phone.number("05#########"),
    position: faker.person.jobTitle(),
    role: "user",
    permissions: [],
  }));

  const allUsersToCreate = [...baseUsers, ...scenarioUsers];

  // Şifreleri hash'le
  for (const user of allUsersToCreate) {
    user.password = await bcrypt.hash("123456", salt);
  }

  const createdUsers = await User.insertMany(allUsersToCreate);

  // Tüm personeller için (hem kullanıcı olanlar hem de sanal olanlar) ID listesi oluştur
  const personnelList = [
    ...new Set(createdUsers.map((u) => u.username)), // Kullanıcı olanları al (Set ile tekilleştir)
    ...Array.from({ length: 380 }, () => faker.person.fullName()), // Rastgele sanal personeller ekle
    "Zimmeti Olmayan Personel",
  ];

  const personnelIdMap = new Map();
  personnelList.forEach((name) => {
    if (!personnelIdMap.has(name)) {
      personnelIdMap.set(name, []);
    }
    const user = createdUsers.find(
      (u) =>
        u.username === name && !personnelIdMap.get(name).some((p) => p.isUser)
    );
    const id = user
      ? user._id.toString()
      : new mongoose.Types.ObjectId().toString();

    personnelIdMap.get(name).push({
      name,
      id: `${name
        .replace(/\s/g, ".")
        .toLowerCase()}.${faker.string.alphanumeric(4)}`,
      isUser: !!user,
    });
  });

  const personnelWithIds = Array.from(personnelIdMap.values()).flat();

  return { createdUsers, personnelWithIds };
};

/**
 * Konum verilerini oluşturur.
 */
const createLocations = async () => {
  console.log("Konumlar oluşturuluyor...".cyan);
  const locationsData = [
    { name: "Merkez Ofis" },
    { name: "Fabrika" },
    { name: "ANKARA" },
    { name: "İSTANBUL" },
    { name: "İZMİR" },
  ];
  return await Location.insertMany(locationsData);
};

/**
 * Eşya verilerini oluşturur.
 */
const createItems = async () => {
  console.log("Eşyalar oluşturuluyor...".cyan);
  const itemsToCreate = [];
  const assetTypes = ["Laptop", "Monitör", "Telefon", "Yazıcı", "Klavye"];
  for (let i = 0; i < 1500; i++) {
    itemsToCreate.push({
      name: `${faker.commerce.productAdjective()} ${
        assetTypes[Math.floor(Math.random() * assetTypes.length)]
      }`,
      assetType: assetTypes[Math.floor(Math.random() * assetTypes.length)],
      assetSubType: faker.commerce.department(),
      fixedAssetType: `SK-${faker.string.numeric(4)}`,
      brand: faker.company.name(),
      assetTag: `DMB-${faker.string.alphanumeric(8).toUpperCase()}`,
      serialNumber: faker.string.alphanumeric(12).toUpperCase(),
      modelYear: faker.date.past({ years: 5 }).getFullYear().toString(),
      networkInfo: `MAC: ${faker.internet.mac()}`,
      softwareInfo: "Windows 11, Office 365, Adobe Reader",
      description: faker.commerce.productDescription(),
    });
  }
  return await Item.insertMany(itemsToCreate);
};

/**
 * Tüm zimmet senaryolarını ve rastgele zimmetleri oluşturur.
 */
const createAssignments = async (
  personnelWithIds,
  createdItems,
  createdLocations,
  logUser // Geçmiş kayıtlarını oluşturacak kullanıcı
) => {
  console.log("Zimmetler hazırlanıyor...".cyan);
  let assignmentsToCreate = [];
  let itemIndex = 0;

  const getPersonnel = (name) => personnelWithIds.find((p) => p.name === name);
  const getPersonnelByIdx = (idx) => personnelWithIds[idx];

  const createAssignment = (
    personnelObject,
    item,
    status,
    dateOptions = {},
    options = {}
  ) => {
    const randomLocation =
      createdLocations[Math.floor(Math.random() * createdLocations.length)];
    return {
      personnelName: personnelObject.name,
      item: item._id,
      personnelId: personnelObject.id,
      company: randomLocation._id,
      location: `${randomLocation.name} Ofis`,
      unit: faker.commerce.department(),
      registeredSection: "Bilgi İşlem",
      previousUser: options.previousUser || "",
      assignmentNotes: options.notes || faker.lorem.sentence(),
      status,
      assignmentDate:
        dateOptions.assignmentDate || faker.date.past({ years: 2 }),
      returnDate:
        dateOptions.returnDate ||
        (status === "İade Edildi" || status === "Hurda"
          ? faker.date.recent({ days: 30 })
          : null),
      formPath: options.addForm ? "/uploads/form-1761160511750.png" : null,
      history: [
        {
          user: logUser._id,
          username: logUser.username,
          changes: [{ field: "status", from: "yok", to: "oluşturuldu" }],
        },
      ],
    };
  };

  // --- Senaryolar ---
  const sibelYilmaz = getPersonnel("Sibel Yılmaz");
  if (sibelYilmaz) {
    console.log("-> Senaryo: Sibel Yılmaz (Karma Profil)".magenta);
    assignmentsToCreate.push(
      createAssignment(
        sibelYilmaz,
        createdItems[itemIndex++],
        "Zimmetli",
        {},
        { addForm: true }
      )
    );
    assignmentsToCreate.push(
      createAssignment(sibelYilmaz, createdItems[itemIndex++], "Zimmetli")
    );
    assignmentsToCreate.push(
      createAssignment(sibelYilmaz, createdItems[itemIndex++], "Arızalı")
    );
  }

  const mehmets = personnelWithIds.filter((p) => p.name === "Mehmet Öztürk");
  if (mehmets.length > 1) {
    console.log("-> Senaryo: Mehmet Öztürk (Aynı İsim)".magenta);
    assignmentsToCreate.push(
      createAssignment(mehmets[0], createdItems[itemIndex++], "Zimmetli")
    );
    assignmentsToCreate.push(
      createAssignment(mehmets[1], createdItems[itemIndex++], "Zimmetli")
    );
  }

  const aliVeli = getPersonnel("Ali Veli");
  if (aliVeli) {
    console.log("-> Senaryo: Ali Veli (Bekleyen Zimmetler)".magenta);
    for (let i = 0; i < 5; i++) {
      assignmentsToCreate.push(
        createAssignment(
          aliVeli,
          createdItems[itemIndex++],
          "Beklemede",
          {},
          { addForm: i === 0 }
        )
      );
    }
  }

  const arizaSorumlusu = getPersonnel("Arıza Sorumlusu");
  if (arizaSorumlusu) {
    console.log("-> Senaryo: Arızalı & Hurda Yaşam Döngüsü".magenta);
    // Arızalı Eşya Senaryosu
    const itemForFault = createdItems[itemIndex++];
    const faultUser = getPersonnelByIdx(20);
    const faultDate1 = faker.date.between({
      from: subYears(new Date(), 2),
      to: subYears(new Date(), 1),
    });
    const faultDate2 = faker.date.between({ from: faultDate1, to: new Date() });
    assignmentsToCreate.push(
      createAssignment(faultUser, itemForFault, "İade Edildi", {
        assignmentDate: faultDate1,
        returnDate: faultDate2,
      })
    );
    assignmentsToCreate.push(
      createAssignment(arizaSorumlusu, itemForFault, "Arızalı", {
        assignmentDate: faultDate2,
      })
    );

    // Hurda Eşya Senaryosu
    const itemForScrap = createdItems[itemIndex++];
    const scrapUser1 = getPersonnelByIdx(21);
    const scrapUser2 = getPersonnelByIdx(22);
    const scrapDate1 = faker.date.between({
      from: subYears(new Date(), 3),
      to: subYears(new Date(), 2),
    });
    const scrapDate2 = faker.date.between({
      from: scrapDate1,
      to: subYears(new Date(), 1),
    });
    const scrapDate3 = faker.date.between({
      from: scrapDate2,
      to: subDays(new Date(), 10),
    });
    const scrapDate4 = faker.date.between({ from: scrapDate3, to: new Date() });
    assignmentsToCreate.push(
      createAssignment(scrapUser1, itemForScrap, "İade Edildi", {
        assignmentDate: scrapDate1,
        returnDate: scrapDate2,
      })
    );
    assignmentsToCreate.push(
      createAssignment(scrapUser2, itemForScrap, "Arızalı", {
        assignmentDate: scrapDate2,
        returnDate: scrapDate3,
      })
    );
    assignmentsToCreate.push(
      createAssignment(arizaSorumlusu, itemForScrap, "Hurda", {
        assignmentDate: scrapDate3,
        returnDate: scrapDate4,
      })
    );
  }

  // --- Kalan Eşyalara Rastgele Geçmiş Oluştur ---
  console.log(
    "-> Kalan eşyalar için rastgele geçmişler oluşturuluyor...".magenta
  );
  while (itemIndex < createdItems.length) {
    const itemToAssign = createdItems[itemIndex++];
    const historySteps = faker.number.int({ min: 1, max: 3 });
    let lastReturnDate = subYears(new Date(), 5);
    let previousPersonnelName = "";

    for (let j = 0; j < historySteps; j++) {
      const isLastStep = j === historySteps - 1;
      const randomPersonnel = getPersonnelByIdx(
        faker.number.int({ min: 0, max: personnelWithIds.length - 3 })
      );
      const assignmentDate = faker.date.between({
        from: lastReturnDate,
        to: new Date(),
      });

      let status = "İade Edildi";
      if (isLastStep) {
        const rand = Math.random();
        status =
          rand < 0.4 // %40 ihtimalle "Zimmetli" (Aktif)
            ? "Zimmetli"
            : rand < 0.75 // %35 ihtimalle "İade Edildi" (Boşta)
            ? "İade Edildi"
            : rand < 0.85 // %10 ihtimalle "Arızalı"
            ? "Arızalı"
            : rand < 0.95 // %10 ihtimalle "Hurda"
            ? "Hurda"
            : "Beklemede"; // %5 ihtimalle "Beklemede"
      }

      const assignmentOptions = { assignmentDate };
      if (status === "İade Edildi") {
        const returnDate = faker.date.between({
          from: assignmentDate,
          to: new Date(),
        });
        assignmentOptions.returnDate = returnDate;
        lastReturnDate = returnDate;
      }

      assignmentsToCreate.push(
        createAssignment(
          randomPersonnel,
          itemToAssign,
          status,
          assignmentOptions,
          { previousUser: previousPersonnelName }
        )
      );
      previousPersonnelName = randomPersonnel.name;
    }
  }

  await Assignment.insertMany(assignmentsToCreate);
};

/**
 * Veritabanındaki tüm verileri siler.
 */
const destroyData = async () => {
  try {
    await Assignment.deleteMany();
    await Item.deleteMany();
    await Location.deleteMany();
    await User.deleteMany();

    console.log("Tüm veriler silindi!".red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
