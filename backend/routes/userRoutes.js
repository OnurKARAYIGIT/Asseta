const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserPassword,
  getAllUsers,
  deleteUser,
  updateUserByAdmin,
  resetUserPassword,
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
router.route("/profile").get(protect, getUserProfile);
router.route("/profile/password").put(protect, updateUserPassword);

router.route("/").get(protect, getAllUsers);
router
  .route("/:id")
  .delete(protect, adminOrDeveloper, protectDeveloper, deleteUser)
  .put(protect, adminOrDeveloper, protectDeveloper, updateUserByAdmin);

router
  .route("/:id/reset-password")
  .put(protect, adminOrDeveloper, protectDeveloper, resetUserPassword);

module.exports = router;
