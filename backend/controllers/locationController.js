const asyncHandler = require("express-async-handler");
const Location = require("../models/locationModel");
const logAction = require("../utils/auditLogger");

// @desc    Yeni bir konum oluşturur
// @route   POST /api/locations
// @access  Private/Admin
const createLocation = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Konum adı zorunludur.");
  }

  const location = new Location({
    name,
  });

  const createdLocation = await location.save();
  await logAction(
    req.user,
    "KONUM_OLUŞTURULDU",
    `'${createdLocation.name}' adında yeni bir konum oluşturuldu.`
  );
  res.status(201).json(createdLocation);
});

// @desc    Tüm konumları listeler
// @route   GET /api/locations
// @access  Private
const getLocations = asyncHandler(async (req, res) => {
  // Her bir konuma ait zimmetli eşya ve benzersiz personel sayısını hesaplamak için aggregation kullanıyoruz.
  const locations = await Location.aggregate([
    {
      $lookup: {
        from: "assignments", // Zimmetlerin bulunduğu koleksiyonun adı
        localField: "_id", // Konumun ID'sini kullan
        foreignField: "company", // Zimmetin şirket/konum ID'si ile eşleştir
        as: "assignments",
      },
    },
    {
      $addFields: {
        // Sadece 'Zimmetli' durumundaki kayıtları filtrele
        activeAssignments: {
          $filter: {
            input: "$assignments",
            as: "assignment",
            cond: { $eq: ["$$assignment.status", "Zimmetli"] },
          },
        },
      },
    },
    {
      $addFields: {
        assignedItemsCount: { $size: "$activeAssignments" },
        // Aktif zimmetlerdeki benzersiz personel ID'lerini say
        personnelCount: {
          $size: { $setUnion: "$activeAssignments.personnel" },
        },
      },
    },
    {
      $project: {
        name: 1,
        address: 1,
        contact: 1,
        assignedItemsCount: 1,
        personnelCount: 1,
      }, // Gereksiz 'assignments' ve 'activeAssignments' dizilerini sonuçtan kaldır
    },
    { $sort: { name: 1 } }, // Sonuçları isme göre sırala
  ]);
  res.json(locations);
});

// @desc    Bir konumu günceller
// @route   PUT /api/locations/:id
// @access  Private/Admin
const updateLocation = asyncHandler(async (req, res) => {
  const { name, address, contact } = req.body;
  const location = await Location.findById(req.params.id);

  if (location) {
    location.name = name || location.name;
    location.address = address || location.address;
    location.contact = contact || location.contact;

    const updatedLocation = await location.save();
    await logAction(
      req.user,
      "KONUM_GÜNCELLENDİ",
      `'${updatedLocation.name}' adlı konum güncellendi.`
    );
    res.json(updatedLocation);
  } else {
    res.status(404);
    throw new Error("Konum bulunamadı.");
  }
});

// @desc    Bir konumu siler
// @route   DELETE /api/locations/:id
// @access  Private/Admin
const deleteLocation = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);

  if (location) {
    // İsteğe bağlı: Bu konuma bağlı zimmet veya eşya olup olmadığını kontrol et
    // const assignmentExists = await Assignment.findOne({ company: location._id });
    // if (assignmentExists) {
    //   res.status(400);
    //   throw new Error("Bu konuma ait zimmet kayıtları olduğundan silinemez.");
    // }

    await location.deleteOne();
    await logAction(
      req.user,
      "KONUM_SİLİNDİ",
      `'${location.name}' adlı konum silindi.`
    );
    res.json({ message: "Konum başarıyla silindi." });
  } else {
    res.status(404);
    throw new Error("Konum bulunamadı.");
  }
});

module.exports = {
  createLocation,
  getLocations,
  updateLocation,
  deleteLocation,
};
