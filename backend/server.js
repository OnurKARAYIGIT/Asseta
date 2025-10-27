const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
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

// Ortam değişkenlerini yükle
dotenv.config({ path: path.resolve(__dirname, "./.env") });

const app = express();

// Gelen isteklerdeki JSON verilerini ayrıştırmak için middleware
app.use(express.json());

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
