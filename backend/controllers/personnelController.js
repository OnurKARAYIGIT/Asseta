const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Personnel = require("../models/personnelModel");
const SalaryComponent = require("../models/salaryComponent");
const logAction = require("../utils/auditLogger");

// @desc    Get all personnel with pagination and search
// @route   GET /api/personnel/list
// @access  Private/Admin
const getPersonnelList = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 15;
  const page = Number(req.query.page) || 1;
  const { keyword, company } = req.query;

  let filter = {};
  if (keyword) {
    filter.$or = [
      { fullName: { $regex: keyword, $options: "i" } },
      { employeeId: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { "jobInfo.department": { $regex: keyword, $options: "i" } },
      { "jobInfo.position": { $regex: keyword, $options: "i" } },
    ];
  }
  if (company && mongoose.Types.ObjectId.isValid(company)) {
    filter.company = new mongoose.Types.ObjectId(company);
  }

  const countPipeline = [{ $match: filter }, { $count: "total" }];

  const dataPipeline = [
    { $match: filter },
    { $sort: { createdAt: -1 } },
    { $skip: pageSize * (page - 1) },
    { $limit: pageSize },
    {
      $lookup: {
        from: "salarycomponents",
        localField: "_id",
        foreignField: "personnel",
        as: "components",
      },
    },
    {
      $lookup: {
        from: "personnels",
        localField: "manager",
        foreignField: "_id",
        as: "managerInfo",
      },
    },
    // YENİ: Şirket bilgilerini ekle
    {
      $lookup: {
        from: "locations", // Şirketler 'locations' koleksiyonunda
        localField: "company",
        foreignField: "_id",
        as: "companyInfo",
      },
    },
    {
      $unwind: { path: "$managerInfo", preserveNullAndEmptyArrays: true },
    },
    { $unwind: { path: "$companyInfo", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        "salaryInfo.totalEarnings": {
          $add: [
            { $ifNull: ["$salaryInfo.grossSalary", 0] },
            {
              $reduce: {
                input: {
                  $filter: {
                    input: "$components",
                    as: "comp",
                    cond: { $eq: ["$$comp.type", "Kazanç"] },
                  },
                },
                initialValue: 0,
                in: { $add: ["$$value", "$$this.amount"] },
              },
            },
          ],
        },
        manager: "$managerInfo",
        company: "$companyInfo", // Frontend ile uyumlu hale getir
      },
    },
  ];

  const countResult = await Personnel.aggregate(countPipeline);
  const count = countResult[0]?.total || 0;
  const personnel = await Personnel.aggregate(dataPipeline);

  res.json({
    personnel,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Create new personnel
// @route   POST /api/personnel
// @access  Private/Admin
const createPersonnel = asyncHandler(async (req, res) => {
  const { fullName, email, employeeId } = req.body;

  const personnelExists = await Personnel.findOne({
    $or: [{ email }, { employeeId }],
  });

  if (personnelExists) {
    res.status(400);
    throw new Error("Bu e-posta veya sicil numarası zaten kayıtlı.");
  }

  const personnel = new Personnel({
    ...req.body,
  });

  const createdPersonnel = await personnel.save();

  await logAction(
    req.user,
    "PERSONEL_OLUŞTURULDU",
    `'${createdPersonnel.fullName}' adlı yeni personel kaydı oluşturuldu.`
  );

  res.status(201).json(createdPersonnel);
});

// @desc    Update a personnel
// @route   PUT /api/personnel/:id
// @access  Private/Admin
const updatePersonnel = asyncHandler(async (req, res) => {
  const personnel = await Personnel.findById(req.params.id);

  if (personnel) {
    // Gelen verileri mevcut personel verileriyle birleştir
    personnel.fullName = req.body.fullName || personnel.fullName;
    personnel.employeeId = req.body.employeeId || personnel.employeeId;
    personnel.email = req.body.email || personnel.email;
    personnel.isActive = req.body.isActive ?? personnel.isActive;
    personnel.company = req.body.company || personnel.company;

    personnel.personalInfo = {
      ...personnel.personalInfo,
      ...req.body.personalInfo,
    };
    personnel.contactInfo = {
      ...personnel.contactInfo,
      ...req.body.contactInfo,
    };
    personnel.jobInfo = { ...personnel.jobInfo, ...req.body.jobInfo };
    personnel.manager = req.body.jobInfo.manager || null;

    const updatedPersonnel = await personnel.save();

    await logAction(
      req.user,
      "PERSONEL_GÜNCELLENDİ",
      `'${updatedPersonnel.fullName}' adlı personelin bilgileri güncellendi.`
    );

    res.json(updatedPersonnel);
  } else {
    res.status(404);
    throw new Error("Personel bulunamadı.");
  }
});

// @desc    Get personnel details by ID
// @route   GET /api/personnel/:id
// @access  Private
const getPersonnelById = asyncHandler(async (req, res) => {
  const personnelId = new mongoose.Types.ObjectId(req.params.id);

  const pipeline = [
    { $match: { _id: personnelId } },
    {
      $lookup: {
        from: "salarycomponents",
        localField: "_id",
        foreignField: "personnel",
        as: "components",
      },
    },
    {
      $lookup: {
        from: "personnels",
        localField: "manager",
        foreignField: "_id",
        as: "managerInfo",
      },
    },
    {
      $lookup: {
        from: "documents",
        localField: "documents",
        foreignField: "_id",
        as: "documentInfo",
      },
    },
    {
      $unwind: { path: "$managerInfo", preserveNullAndEmptyArrays: true },
    },
    {
      $addFields: {
        manager: "$managerInfo",
        documents: "$documentInfo",
      },
    },
    { $project: { managerInfo: 0, documentInfo: 0, components: 0 } }, // Geçici alanları temizle
  ];

  const results = await Personnel.aggregate(pipeline);
  const personnel = results[0];

  if (personnel) {
    res.json(personnel);
  } else {
    res.status(404);
    throw new Error("Personel bulunamadı.");
  }
});

// @desc    Get personnel list for select inputs
// @route   GET /api/personnel/for-selection
// @access  Private
const getPersonnelForSelection = asyncHandler(async (req, res) => {
  const personnel = await Personnel.find({ isActive: true }).select(
    "fullName employeeId"
  );
  res.json(personnel);
});

// @desc    Update personnel's salary information
// @route   PUT /api/personnel/:id/salary
// @access  Private/Admin
const updatePersonnelSalary = asyncHandler(async (req, res) => {
  const { grossSalary, currency } = req.body;

  const personnel = await Personnel.findById(req.params.id);

  if (!personnel) {
    res.status(404);
    throw new Error("Personel bulunamadı.");
  }

  personnel.salaryInfo = {
    grossSalary: grossSalary,
    currency: currency,
  };

  const updatedPersonnel = await personnel.save();

  await logAction(
    req.user,
    "MAAŞ_GÜNCELLENDİ",
    `'${personnel.fullName}' adlı personelin maaş bilgileri güncellendi.`
  );

  res.json(updatedPersonnel.salaryInfo);
});

// @desc    Get salary components for a personnel
// @route   GET /api/personnel/:id/components
// @access  Private/Admin
const getSalaryComponents = asyncHandler(async (req, res) => {
  const components = await SalaryComponent.find({ personnel: req.params.id });
  res.json(components);
});

// @desc    Add a salary component to a personnel
// @route   POST /api/personnel/:id/components
// @access  Private/Admin
const addSalaryComponent = asyncHandler(async (req, res) => {
  const { name, type, amount } = req.body;

  const component = new SalaryComponent({
    personnel: req.params.id,
    name,
    type,
    amount,
  });

  const createdComponent = await component.save();
  res.status(201).json(createdComponent);
});

// @desc    Delete a salary component
// @route   DELETE /api/personnel/:id/components/:componentId
// @access  Private/Admin
const deleteSalaryComponent = asyncHandler(async (req, res) => {
  const component = await SalaryComponent.findById(req.params.componentId);

  if (component) {
    await component.deleteOne();
    res.json({ message: "Maaş bileşeni silindi." });
  } else {
    res.status(404);
    throw new Error("Maaş bileşeni bulunamadı.");
  }
});

module.exports = {
  getPersonnelList,
  createPersonnel,
  updatePersonnel,
  getPersonnelById,
  getPersonnelForSelection,
  updatePersonnelSalary,
  getSalaryComponents,
  addSalaryComponent,
  deleteSalaryComponent,
};
