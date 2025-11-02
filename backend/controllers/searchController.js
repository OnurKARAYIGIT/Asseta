const asyncHandler = require("express-async-handler");
const Assignment = require("../models/assignmentModel");
const Item = require("../models/itemModel.js");
const User = require("../models/userModel");
const Personnel = require("../models/personnelModel.js");

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
    // YENİ YAPI: Assignment'ları personel adı ile aramak için aggregation kullan
    Assignment.aggregate([
      {
        $lookup: {
          from: "personnels",
          localField: "personnel",
          foreignField: "_id",
          as: "personnelInfo",
        },
      },
      { $unwind: "$personnelInfo" },
      {
        $lookup: {
          from: "items",
          localField: "item",
          foreignField: "_id",
          as: "itemInfo",
        },
      },
      { $unwind: "$itemInfo" },
      { $match: { "personnelInfo.fullName": regex } },
      {
        $project: {
          "item.name": "$itemInfo.name",
          "item.assetTag": "$itemInfo.assetTag",
          personnelName: "$personnelInfo.fullName",
        },
      },
    ]).limit(5), // Limit results for performance
    Item.find({
      $or: [
        { name: regex },
        { assetTag: regex },
        { serialNumber: regex },
        { brand: regex },
      ],
    }).limit(5),
    // YENİ YAPI: User'ları email veya personel adı ile aramak için aggregation kullan
    User.aggregate([
      {
        $lookup: {
          from: "personnels",
          localField: "personnel",
          foreignField: "_id",
          as: "personnelInfo",
        },
      },
      { $unwind: "$personnelInfo" },
      {
        $match: {
          $or: [{ email: regex }, { "personnelInfo.fullName": regex }],
        },
      },
      {
        $project: {
          email: 1,
          "personnel.fullName": "$personnelInfo.fullName",
          _id: 1,
        },
      },
    ]).limit(5),
  ]);

  res.json({ assignments, items, users });
});

module.exports = { globalSearch };
