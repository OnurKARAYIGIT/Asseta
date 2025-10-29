const express = require("express");
const router = express.Router();
const {
  registerUser,
  logoutUser,
  loginUser,
  getUserProfile,
  updateUserPassword,
  getAllUsers,
  deleteUser,
  updateUserByAdmin,
  resetUserPassword,
  getUserSettings,
  updateUserSettings,
} = require("../controllers/userController");
const {
  protect,
  adminOrDeveloper,
} = require("../middleware/authMiddleware.js");
const {
  protectDeveloper,
} = require("../middleware/authorizationMiddleware.js");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser); // Logout rotasını ekle
router.route("/profile").get(protect, getUserProfile);
router.route("/profile/password").put(protect, updateUserPassword);

// Ayarlar için yeni rotalar
router
  .route("/settings")
  .get(protect, getUserSettings)
  .put(protect, updateUserSettings);

router.route("/").get(protect, getAllUsers);
router
  .route("/:id")
  .delete(protect, adminOrDeveloper, protectDeveloper, deleteUser)
  .put(protect, adminOrDeveloper, protectDeveloper, updateUserByAdmin);

router
  .route("/:id/reset-password")
  .put(protect, adminOrDeveloper, protectDeveloper, resetUserPassword);

module.exports = router;
