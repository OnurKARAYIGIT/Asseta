const asyncHandler = require("express-async-handler");
const Assignment = require("../models/assignmentModel");
const Item = require("../models/itemModel.js");
const User = require("../models/userModel.js");

// @desc    Global search across multiple models
// @route   GET /api/search
// @access  Private
const globalSearch = asyncHandler(async (req, res) => {
  const keyword = req.query.q;

  if (!keyword) {
    return res.json({
      assignments: [],
      items: [],
      users: [],
    });
  }

  const regex = new RegExp(keyword, "i"); // Case-insensitive regex

  // Perform searches in parallel
  const [assignments, items, users] = await Promise.all([
    Assignment.find({
      $or: [{ personnelName: regex }, { unit: regex }, { location: regex }],
    })
      .populate("item", "name assetTag")
      .limit(5), // Limit results for performance
    Item.find({
      $or: [
        { name: regex },
        { assetTag: regex },
        { serialNumber: regex },
        { brand: regex },
      ],
    }).limit(5),
    User.find({ $or: [{ username: regex }, { email: regex }] }).limit(5),
  ]);

  res.json({ assignments, items, users });
});

module.exports = { globalSearch };
