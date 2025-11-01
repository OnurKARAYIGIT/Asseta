const express = require("express");
const router = express.Router();
const { getAllPersonnel } = require("../controllers/personnelController");
const { protect, admin } = require("../middleware/authMiddleware");

// Sadece giriş yapmış kullanıcıların personel listesine erişebilmesi için 'protect' middleware'i kullanıyoruz.
// Eğer sadece adminlerin personel eklemesini/düzenlemesini isterseniz 'admin' de eklenebilir.
router.route("/").get(protect, getAllPersonnel);

module.exports = router;
