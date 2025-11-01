const mongoose = require("mongoose");

const returnReceiptSchema = new mongoose.Schema(
  {
    personnel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Personnel",
      required: true,
    },
    returnedItems: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
        },
        assignmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Assignment",
        },
      },
    ],
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReturnReceipt", returnReceiptSchema);
