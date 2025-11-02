const express = require("express");
const router = express.Router();
const { deleteDocument } = require("../controllers/documentController");
const { protect, adminOrDeveloper } = require("../middleware/authMiddleware");

router.route("/:docId").delete(protect, adminOrDeveloper, deleteDocument);

module.exports = router;
