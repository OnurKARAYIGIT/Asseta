const path = require("path");
// .env dosyasındaki değişkenleri process.env'e yükle
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/db.js");

// Rota dosyalarını import et
const testRoutes = require("./routes/testRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const locationRoutes = require("./routes/locationRoutes.js");
const itemRoutes = require("./routes/itemRoutes.js");
const assignmentRoutes = require("./routes/assignmentRoutes.js");
const uploadRoutes = require("./routes/uploadRoutes.js");
const auditLogRoutes = require("./routes/auditLogRoutes.js");
const dashboardRoutes = require("./routes/dashboardRoutes.js");
const searchRoutes = require("./routes/searchRoutes.js");

const app = express();

// Gelen isteklerdeki JSON verilerini ayrıştırmak için middleware
app.use(express.json());
app.use(cookieParser());

// Farklı domainlerden gelen isteklere izin vermek için CORS'u etkinleştir
app.use(cors());

// Rotaları kullan
app.use("/api", testRoutes); // API endpoint'lerimizi /api altında toplayalım
app.use("/api/users", userRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/search", searchRoutes);

// Yüklenen dosyaları dışarıya açmak için uploads klasörünü statik yap
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- HATA YÖNETİMİ MIDDLEWARE'LERİ ---

// 404 Not Found Handler (Eşleşmeyen Rotalar İçin)
app.use((req, res, next) => {
  const error = new Error(`Bulunamadı - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Genel Hata Yakalayıcı (Tüm Hatalar İçin)
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB(); // Önce veritabanına bağlan
    app.listen(PORT, () => {
      console.log(`Sunucu ${PORT} portunda çalışıyor...`);
    });
  } catch (error) {
    console.error("Sunucu başlatılamadı:", error);
  }
};

startServer();
