const express = require("express");
const router = express.Router();
const {
  createItem,
  getItems,
  updateItem,
  deleteItem,
  checkUniqueness,
} = require("../controllers/itemController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(protect, getItems)
  .post(protect, adminOrDeveloper, createItem);
router.route("/check-unique").post(protect, adminOrDeveloper, checkUniqueness);

router
  .route("/:id")
  .put(protect, adminOrDeveloper, updateItem)
  .delete(protect, adminOrDeveloper, deleteItem);

module.exports = router;
