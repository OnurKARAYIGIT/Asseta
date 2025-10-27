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
  const locations = await Location.find({});
  res.json(locations);
});

module.exports = {
  createLocation,
  getLocations,
};
