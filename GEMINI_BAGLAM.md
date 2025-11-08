## Proje Analizi ve Kullanım Kılavuzu: Asseta

Bu doküman, Asseta projesinin amacını, mimarisini, iş akışlarını, teknik detaylarını ve kullanım senaryolarını en ince ayrıntısına kadar açıklayan kapsamlı bir rehberdir.

### 1. Kurulum ve Başlangıç Kılavuzu

Bu bölüm, projeyi yerel geliştirme ortamında çalıştırmak için gereken adımları içerir.

1.  **Ön Gereksinimler:**

    - Node.js (LTS versiyonu önerilir)
    - MongoDB (Yerel veya bulut tabanlı bir veritabanı)

2.  **Projeyi Klonlama:**

    ```bash
    git clone <repository_url>
    cd Asseta
    ```

3.  **Backend Kurulumu:**

    ```bash
    cd backend
    npm install
    ```

4.  **Frontend Kurulumu:**

    ```bash
    cd ../frontend
    npm install
    ```

5.  **Ortam Değişkenleri (`.env`):**
    `backend` klasörünün ana dizininde `.env` adında bir dosya oluşturun ve aşağıdaki değişkenleri kendi MongoDB ve JWT ayarlarınızla doldurun:

    ```
    NODE_ENV=development
    MONGO_URI=mongodb://localhost:27017/asseta
    JWT_SECRET=sizin_super_gizli_anahtariniz
    ```

6.  **Veritabanını Hazırlama (Seeder):**
    Test verilerini veritabanına yüklemek için `backend` klasöründeyken aşağıdaki komutu çalıştırın:

    ```bash
    npm run data:import
    ```

7.  **Uygulamayı Çalıştırma:**
    Projenin ana dizinindeyken (`Asseta/`) aşağıdaki komutu çalıştırın. Bu komut, hem backend sunucusunu hem de frontend geliştirme sunucusunu aynı anda başlatır.
    ```bash
    npm run dev
    ```
    Uygulama varsayılan olarak `http://localhost:5173` adresinde açılacaktır.

### 1. Proje Amacı ve Ana İş Akışları

Projenin temel amacı, bir organizasyonun üç kritik operasyonunu tek bir çatı altında dijitalleştirmektir: **Varlık Yönetimi**, **İnsan Kaynakları (İK)** ve **İşe Alım**.

**Ana İş Akışı (Varlık Yönetimi):**
Sistem, **Item** (Eşya) olarak adlandırılan fiziksel varlıkların detaylı envanterini tutar. Bu eşyalar, **Personnel** (Personel) kayıtlarına **Assignment** (Zimmet) işlemi ile atanır. Zimmetler, `pdfkit` kütüphanesi kullanılarak dinamik olarak oluşturulan "Zimmet Teslim Tutanağı" (PDF) olarak çıktılanabilir. Kullanım ömrü dolan veya iade edilen zimmetler, tekli veya toplu olarak "İade Tutanağı" ile sisteme geri alınır ve ilgili eşyanın durumu otomatik olarak "Boşta" konumuna getirilir. Her eşyanın tüm zimmet geçmişi, kendi detay sayfasından izlenebilir.

**Ana İş Akışı (İnsan Kaynakları):**
Sistem, detaylı **Personnel** kayıtları tutar. Her çalışanın kendi kişisel sayfasından yönetebileceği süreçler mevcuttur:

- **Mesai Takibi:** Çalışanlar, **AttendanceRecord** (Mesai Kaydı) ile giriş-çıkışlarını yapar. Sistem, normal çalışma süresini ve fazla mesaiyi otomatik olarak hesaplar.
- **İzin Yönetimi:** Çalışanlar, **Leave** (İzin) modülü ile izin talepleri oluşturur, imzalı formlarını yükler ve yöneticiler bu talepleri onaylar veya reddeder.
- **Bordro Yönetimi:** Ay sonunda, mesai ve izin verileri, **SalaryComponent** (ek kazanç/kesintiler) ile birleştirilerek **PayrollPeriod** (Bordro Dönemi) içinde **PayrollRecord** (Bordro Kaydı) oluşturmak için kullanılır. Yöneticiler, banka ödeme listesini CSV formatında dışa aktarabilir.

**Ana İş Akışı (İşe Alım):**
Sistem, **JobOpening** (İş İlanı) oluşturulmasına olanak tanır. Bu ilanlara başvuran **Candidate** (Adaylar), görsel bir Kanban panosu (`RecruitmentPipeline`) üzerinde yönetilir. Adaylar, "Başvuru Alındı"dan "İşe Alındı"ya kadar farklı aşamalarda (`@dnd-kit/core` ile sürükle-bırak) ilerletilir. Süreç içinde adaylara **Interview** (Mülakat) planlanabilir ve **Offer** (Teklif) yapılabilir. Bir aday "İşe Alındı" statüsüne getirildiğinde, sistem otomatik olarak bu adaydan yeni bir **Personnel** kaydı oluşturur, adayın CV'sini yeni personelin evraklarına ekler ve bu kritik işlemi **AuditLog**'a (Denetim Kaydı) işler.

### 2. Teknoloji Yığını (Detaylı)

Proje, modern ve güçlü bir MERN yığını üzerine kurulmuştur.

- **Backend:**
  - **Runtime:** Node.js
  - **Framework:** Express.js
  - **Veritabanı Arayüzü:** Mongoose (MongoDB için ODM)
  - **Kimlik Doğrulama:** JSON Web Tokens (JWT) (`jsonwebtoken` ile `accessToken` ve `refreshToken` stratejisi)
  - **Şifreleme:** `bcryptjs` (Şifre hash'leme için)
  - **PDF Üretimi:** `pdfkit`
  - **Asenkron Hata Yönetimi:** `express-async-handler`
- **Frontend:**
  - **Kütüphane/Framework:** React
  - **State Yönetimi & Veri Çekme:** `@tanstack/react-query` (Sunucu state'i, cache, ve mutasyonlar için merkezi çözüm)
  - **Global State (UI):** React Context API (`AuthContext`, `SettingsContext`, `PendingCountContext`)
  - **Routing:** `react-router-dom`
  - **Sürükle-Bırak:** `@dnd-kit/core` (`useDraggable` ve `useDroppable` hook'ları ile)
  - **Stil/UI:** Tailwind CSS
  - **HTTP İstekleri:** `axios` (Interceptor'lar ile merkezi token yönetimi)
  - **Grafikler:** `chart.js` ve `react-chartjs-2`
  - **Bildirimler:** `react-toastify`
- **Veritabanı:**
  - MongoDB (NoSQL, doküman tabanlı)

### 3. Backend Mimarisi ve Veri Akışı

Backend, klasik ve etkili bir MVC (Model-View-Controller) benzeri yapı kullanır:

1.  **İstek (Request):** Frontend'den gelen bir API isteği (`/api/applications/:id/status`) ilk olarak Express sunucusuna ulaşır.
2.  **Yönlendirme (Routing - `routes/`):** İlgili rota dosyası (`applicationRoutes.js`) isteği yakalar. Bu aşamada, `authMiddleware` gibi ara yazılımlar devreye girerek isteğin yetkili bir kullanıcıdan gelip gelmediğini kontrol eder.
3.  **Kontrolcü (Controller - `controllers/`):** Rota, isteği ilgili kontrolcü fonksiyonuna (`updateApplicationStatus`) yönlendirir.
4.  **İş Mantığı ve Veritabanı İşlemleri:** Kontrolcü, isteğin gerektirdiği iş mantığını yürütür. `updateApplicationStatus` örneğinde, başvurunun durumunu günceller. Eğer yeni durum "İşe Alındı" ise, `Candidate` ve `JobOpening` modellerinden ek bilgi çeker, yeni bir `Personnel` kaydı oluşturur, adayın CV'sini yeni `Document` kaydına dönüştürür ve `logAction` yardımcısı ile bir `AuditLog` kaydı oluşturur. Kontrolcüler, Mongoose'un `populate`, `aggregate` ve `virtual populate` gibi güçlü özelliklerini kullanarak karmaşık veri ilişkilerini verimli bir şekilde yönetir.
5.  **Model (models/):** Mongoose modelleri (`Application`, `Personnel`, `Document` vb.), veritabanı şemalarını tanımlar ve kontrolcünün veritabanı ile etkileşim kurmasını sağlar.
6.  **Yanıt (Response):** Kontrolcü, veritabanı işlemlerinin sonucunu işler ve `res.json()` ile frontend'e JSON formatında bir yanıt gönderir.

### 4. Frontend Mimarisi ve Bileşen Yapısı

Frontend, bileşen tabanlı ve state yönetimini ayıran modern bir React mimarisine sahiptir.

- **`src/pages`:** Uygulamanın ana sayfalarını oluşturan "akıllı" (smart) veya "container" bileşenlerdir. `RecruitmentPage.jsx` gibi sayfalar, veri çekme (`useQuery`), mutasyonlar (`useMutation`) ve genel sayfa state'ini yönetme sorumluluğunu üstlenir.
- **`src/components`:** Tekrar kullanılabilir "sunumsal" (presentational) veya "aptal" (dumb) bileşenleri içerir. Bu bileşenler genellikle `props` aracılığıyla veri alır ve UI'ı render ederler. `RecruitmentPipeline.jsx`, `PipelineColumn.jsx` ve `CandidateCard.jsx` bu yapıya harika örneklerdir.
- **State Yönetimi:**
  - **Sunucu State'i:** Projenin en güçlü yanı, sunucu state'ini yönetmek için `@tanstack/react-query` kullanmasıdır. Bu, veri çekme, önbellekleme, arka planda tazeleme ve **iyimser güncellemeler (optimistic updates)** gibi karmaşık işlemleri basitleştirir. `RecruitmentPage`'deki `updateApplicationStatus` mutasyonu, bir kart sürüklendiğinde arayüzün anında güncellenmesini sağlayan `onMutate` ile bu tekniği etkili bir şekilde kullanır.
  - **Global UI State'i:** `AuthContext`, uygulama genelinde kullanıcı bilgilerini ve kimlik doğrulama durumunu yönetir. `SettingsContext` ve `PendingCountContext` gibi diğer context'ler, sırasıyla kullanıcı ayarlarını ve bekleyen görev sayılarını yönetir. Bu, gereksiz prop-drilling'i önler.
  - **Lokal State:** `useState`, tek bir bileşeni ilgilendiren geçici durumlar (örn: bir modal'ın açık/kapalı olması) için kullanılır.

### 5. Veritabanı Modelleri ve İlişkileri

`models` klasörü, zengin ve ilişkisel bir veri yapısını ortaya koyuyor:

- **User ↔ Personnel (1-1):** Her `User` (sisteme giriş yapan hesap), bir `Personnel` (çalışan) kaydına bağlıdır. Bir personel olmadan kullanıcı hesabı oluşturulamaz.
- **Application → Candidate & JobOpening (Çoka-1):** Her `Application` (başvuru), bir `Candidate` ve bir `JobOpening`'e aittir.
- **Candidate ↔ Application (1-Çok, Sanal):** `candidateModel.js` içindeki `virtual populate` özelliği sayesinde, bir adayın tüm başvurularına, şemada fiziksel bir alan olmadan erişilebilir.
- **Interview → Application (Çoka-1):** Birçok mülakat, tek bir başvuruya aittir.
- **Assignment → Item (1-1):** Her `Assignment` (zimmet), sadece bir `Item`'a (eşya) işaret eder.
- **Assignment → Personnel (Çoka-1):** Bir `Personnel`, birden çok `Assignment`'a sahip olabilir.
- **Personnel ↔ Personnel (1-Çok, Opsiyonel):** `manager` alanı, bir personelin başka bir personele yönetici olarak atanabildiğini gösterir. Bu, hiyerarşik onay mekanizmaları için bir altyapı sunar.
- **AuditLog → User & Entity:** Bir `AuditLog` kaydı, işlemi yapan `User`'ı ve işlemin ilgili olduğu varlığı (`entityId` ile `Personnel`, `Item` vb.) referans alır.

### 6. Güvenlik ve Kimlik Doğrulama

- **JWT Stratejisi:** Sistem, `accessToken` (kısa ömürlü, 1 saat) ve `refreshToken` (uzun ömürlü, 7 gün) kullanır. `accessToken`, her API isteğinde `Authorization` başlığında gönderilir.
- **Token Yenileme:** `accessToken`'ın süresi dolduğunda, frontend'deki `axios` interceptor'ı 401 hatasını yakalar ve `refreshToken`'ı kullanarak `/api/users/refresh-token` endpoint'inden yeni bir `accessToken` talep eder. Bu, kullanıcı deneyimini kesintisiz hale getirir.
- **Oturum Yönetimi:** `AuthContext.jsx` içinde hem oturum süresinin dolmasına yakın uyarı (`SessionWarningToast`) hem de kullanıcı hareketsizliğine bağlı otomatik çıkış (`InactivityWarningToast`) mekanizmaları bulunur. Bu, güvenlik için mükemmel bir yaklaşımdır.
- **API Koruma:** Backend'de `authMiddleware.js` içindeki `protect` ve `adminOrDeveloper` gibi ara yazılımlar, korumalı API yollarına gelen isteklerde `accessToken`'ı doğrular ve `req.user` nesnesini oluşturur.

### 7. Yapılandırma (Config) ve Ortam Değişkenleri

Proje, yapılandırmasını `.env` dosyasından okur. `seeder.js` ve `userController.js` gibi dosyalardan anlaşılan temel anahtarlar şunlardır:

- `MONGO_URI`: MongoDB bağlantı adresi.
- `JWT_SECRET`: JSON Web Token'larını imzalamak için kullanılan gizli anahtar.
- `NODE_ENV`: Uygulamanın çalışma ortamı (`development` veya `production`).

### 8. Modül ve Sayfa Bazında Detaylı Yetenek Analizi

Bu bölüm, uygulamanın her bir sayfasının ve modülünün sunduğu yetenekleri kullanıcı perspektifinden detaylandırmaktadır.

#### **Ana Panel (Dashboard - `/`)**

- **Genel Bakış:** Tüm sistemin anlık bir özetini sunan, kritik bilgilere ve sık kullanılan sayfalara hızlı erişim sağlayan bir kontrol merkezidir.
- **İstatistik Kartları:** "Toplam Zimmet", "Açık İş İlanı", "Bekleyen İzin Talebi" gibi metriklere tek bakışta erişim sağlar. Bu kartlar tıklanabilirdir ve kullanıcıyı doğrudan ilgili, filtrelenmiş sayfaya yönlendirir.
- **Görsel Raporlar:** Varlıkların türüne, durumuna, konumuna ve aylık zimmetleme yoğunluğuna göre dağılımını gösteren dinamik pasta ve çubuk grafikler içerir.
- **Son Aktiviteler:** Sistemde yapılan en son zimmet işlemlerini listeler.

#### **Varlık Yönetimi (Zimmetler Menüsü)**

- **Zimmet Listesi (`/assignments`):** Aktif zimmetleri listeler, kapsamlı arama ve filtreleme sunar. Tekli iade ve PDF yazdırma işlemleri yapılabilir.
- **Eşyalar (`/items`):** Şirketin tüm fiziksel varlıklarının (demirbaşlarının) dijital envanteridir. CRUD işlemleri, durum takibi ve Excel'e aktarma gibi özellikler sunar. Her eşyanın zimmet geçmişi buradan görüntülenebilir.
- **Bekleyenler (`/pending-assignments`):** Zimmet taleplerinin personele göre gruplanarak listelendiği ve yöneticilerin toplu onay/red işlemleri yapabildiği ekrandır.
- **Konumlar (`/locations`):** Şirketin fiziksel lokasyonlarının (ofisler, depolar) yönetildiği ve konum bazlı personel/zimmet sayılarının görüntülendiği yerdir.

#### **İK İşlemleri Menüsü**

- **İşe Alım Yönetimi (`/recruitment`):** Adayların Kanban panosu üzerinde yönetildiği, sürükle-bırak ile süreç adımları arasında ilerletildiği interaktif bir sayfadır. Aday profili görüntüleme, mülakat planlama ve teklif yapma gibi işlemler buradan yönetilir.
- **Aday Havuzu (`/candidates`):** Sisteme kayıtlı tüm adayların listelendiği, telefon numarası ve başvurduğu pozisyonlar gibi detayların görüntülendiği merkezi bir havuzdur.
- **İş İlanları (`/job-openings`):** Aktif ve pasif tüm iş ilanlarının kartlar halinde görüntülendiği, yeni ilan oluşturulup mevcutların düzenlenebildiği bir sayfadır.
- **Mesai, İzin, Maaş ve Bordro:** Çalışanların kendi mesai ve izinlerini yönettiği, yöneticilerin ise tüm personelin mesai kayıtlarını, izin taleplerini, maaş bilgilerini ve bordro dönemlerini yönettiği bir dizi entegre sayfadan oluşur.

#### **Yönetim Paneli Menüsü**

- **Kullanıcı Yönetimi (`/admin`):** Sisteme giriş yapabilen kullanıcı hesaplarının yönetildiği, rol ve özel yetki atamalarının yapıldığı, şifre sıfırlama gibi işlemlerin gerçekleştirildiği kritik bir sayfadır.
- **Personel Yönetimi (`/personnel`):** Tüm çalışanların kayıtlarının oluşturulduğu ve yönetildiği merkezi İK veritabanıdır.
- **Denetim Kayıtları (`/audit-logs`):** Sistemde yapılan tüm önemli işlemlerin (kim, ne zaman, ne yaptı) kaydedildiği, filtrelenebilir ve dışa aktarılabilir bir güvenlik ve şeffaflık aracıdır.

#### **Kullanıcı Menüsü (Sağ Üst Köşe)**

- **Profilim:** Kullanıcının kendi detay sayfasına yönlendirir. Bu sayfada kişisel bilgiler, zimmet geçmişi, izin ve mesai kayıtları gibi tüm kişisel veriler sekmeler halinde bulunur.
- **Ayarlar:** Tablo görünümlerini (sütun gizleme/gösterme) ve sayfalama tercihlerini kişiselleştirme imkanı sunar.
- **Çıkış Yap:** Oturumu güvenli bir şekilde sonlandırır.

### 9. Adım Adım Kullanım Senaryoları

Bu bölüm, projenin temel iş akışlarını bir kullanıcının gözünden adım adım anlatır.

#### **Senaryo 1: Yeni Bir Personelin İşe Alınıp Zimmet Atanması**

1.  **İlan Oluşturma:** `İK İşlemleri > İşe Alım Yönetimi` sayfasında "Yeni İlan" butonuna tıklanarak bir iş ilanı oluşturulur.
2.  **Aday Ekleme:** Aynı sayfada "Yeni Aday" butonu ile bir aday havuza eklenir.
3.  **Süreç Yönetimi:** Aday, Kanban panosunda "Başvuru Alındı" sütununa sürüklenir. Kartına tıklanarak mülakat planlanır ve teklif yapılır.
4.  **İşe Alma:** Aday, "İşe Alındı" sütununa sürüklenir. Sistem otomatik olarak bu adaydan yeni bir personel kaydı oluşturur.
5.  **Hesap Oluşturma:** `Yönetim Paneli > Kullanıcı Yönetimi` sayfasında, yeni oluşturulan bu personele bir kullanıcı hesabı (rol ve şifre) atanır.
6.  **Zimmet Atama:** `Zimmetler > Zimmet Listesi` sayfasında "Yeni Zimmet" butonu ile bu personele bir veya daha fazla eşya zimmetlenir.
7.  **Raporlama:** İşlem sonunda "Zimmet Teslim Tutanağı" PDF olarak yazdırılır.

#### **Senaryo 2: Bir Personelin Zimmetini İade Etmesi**

1.  **İade İşlemi:** `Zimmetler > Zimmet Listesi` sayfasında iade edilecek zimmet bulunur ve satırdaki "İade Al" butonuna tıklanır.
2.  **Toplu İade:** Alternatif olarak, `Zimmetler > Personel Zimmet Raporu` sayfasından personel aranır, zimmetleri listelenir ve "Seçilenleri İade Al" butonu ile toplu iade yapılır.
3.  **Raporlama:** İşlem sonunda "Zimmet İade Tutanağı" PDF olarak yazdırılır.
4.  **Doğrulama:** `Zimmetler > Eşyalar` sayfasında iade edilen eşyanın durumunun "Boşta" olarak güncellendiği kontrol edilir.

### 10. Kritik Kod Yapıları ve Yardımcı Fonksiyonlar

- **Backend Helpers (`/utils`):**
  - `generateToken.js`: JWT'lerin nasıl oluşturulduğunu ve ömürlerini (`1h`, `7d`) belirler.
  - `auditLogger.js`: `logAction` fonksiyonu, sistemdeki tüm kritik işlemleri (kim, ne zaman, ne yaptı, hangi IP'den) `AuditLog` modeline kaydeder.
- **Frontend Hooks (`/hooks`):**
  - `useInactivityTimeout.js`: Kullanıcı belirli bir süre (varsayılan 5 dk) işlem yapmazsa, bir uyarı gösterir ve süre sonunda otomatik olarak çıkış yapar.
  - `useItemMutations.js`: `@tanstack/react-query`'nin `useMutation`'ını soyutlayarak, veri değiştirme işlemlerinde `toast` bildirimlerini ve `query invalidation`'ı merkezi hale getirir.
- **API İletişimi (`axiosInstance.js`):**
  - **Request Interceptor:** Her API isteğine `Authorization` başlığını otomatik olarak ekler.
  - **Response Interceptor:** 401 (Unauthorized) hatası alındığında, `refreshToken` fonksiyonunu çağırarak token yenileme işlemini otomatikleştirir ve başarısız isteği tekrarlar.

### 11. Deployment ve Build Süreci

- **Build:** `frontend` klasöründe `npm run build` komutu çalıştırıldığında, React projesi optimize edilmiş, statik HTML, CSS ve JavaScript dosyalarına dönüştürülür ve `frontend/dist` klasörüne kaydedilir.
- **Production Ortamı:** `backend/server.js` içinde, `NODE_ENV` 'production' olarak ayarlandığında, Express sunucusu `frontend/dist` klasöründeki bu statik dosyaları sunmak üzere yapılandırılmıştır. Bu, backend ve frontend'in aynı port üzerinden tek bir birim olarak çalışmasını sağlar.

### 12. Keşfedilen İş Mantığı ve "NEDEN?" Soruları

- **(Analizim) Zimmet Listeleme Varsayılan Filtresi:** `assignmentController.js` içindeki `getAssignments` fonksiyonunda, eğer özel bir `status` filtresi gönderilmezse, sistem varsayılan olarak sadece `status: "Zimmetli"` olan kayıtları listeliyor.

  - **(Cevap)** Evet böyle çünkü ana sayfada detaylı bir grafiğimiz var ve burda tüm eşya durumlarının raporunu zaten görebiliyoruz bu sayfada zimmetli olan eşya onun özellikleri formu ve kullanıcısı gibi bilgileri görmemiz yeterli.

- **(Analizim) Token'ların İkili Dağıtımı:** `userController.js` içindeki `loginUser` fonksiyonu, `accessToken` ve `refreshToken`'ı hem `httpOnly` cookie olarak tarayıcıya set ediyor hem de JSON yanıtı içinde frontend'e gönderiyor. Frontend (`AuthContext.js`) ise bu token'ları `localStorage`'a kaydediyor.

  - **(Cevap)** Evet ilerde bir mobil veya desktop uygulaması gibi hedefim var.

- **(Analizim) Yetim Zimmet Senaryosu:** `seeder.js` dosyasında, bir personel silinmeden önce bu personele ait zimmetlerin `personnel` alanı `null` olarak güncelleniyor. Bu, "yetim" bir zimmet kaydı oluşturuyor.
  - **(Cevap)** Aslında bu durum tamamen test amaçlı sistemin nasıl davranacağını kontrol etmek için. Normalde bir personel işten ayrılsa bile veri tabanımızda bu personel ait bilgiler tutulacak fakat pasif durumda bir personel olacak. Çünkü IK modelimiz de olduğu için bunu sadece zimmet uygulaması olarak değil bir ekosistem olarak düşün sadece şuan için IK ve zimmet modülümüz var bunlara ek ISG Araç Takip Kamera sistemleri gibi birçok modül ekleyebiliriz.

### 13. Bilinmeyenler ve Dış Bağımlılıklar

- **(Analizim)** Projenizde, dışarıya (örneğin bir hava durumu API'si, döviz kuru servisi vb.) yapılan bir `axios` veya `fetch` çağrısı bulunmuyor. Tüm iş mantığı ve veri akışı, projenin kendi backend'i ve veritabanı üzerinde gerçekleşiyor. Bu, projenin kendi kendine yeten, kapalı bir ekosistem olduğunu gösteriyor ki bu da yönetilebilirlik açısından büyük bir avantajdır.

### 14. Testler ve Hata Yönetimi

- **(Analizim) Test Dosyaları:** Proje dosyaları arasında **`__tests__`** klasörü veya `.test.js` / `.spec.js` uzantılı dosyalar bulunmuyor. Bu, projede henüz otomatikleştirilmiş birim (unit) veya entegrasyon (integration) testlerinin yazılmadığını gösteriyor.
- **(Analizim) Hata Yönetim Stratejisi:**
  - **Backend:** `express-async-handler` kütüphanesi, asenkron kontrolcülerdeki hataları yakalayıp Express'in merkezi hata yönetimi mekanizmasına iletiyor. Bu, `try-catch` bloklarının tekrarını önleyen temiz bir yaklaşımdır.
  - **Frontend:** Hatalar, `@tanstack/react-query`'nin `isError` ve `error` alanları kullanılarak bileşen bazında yakalanıyor. Kullanıcıya geri bildirim ise `react-toastify` kütüphanesi ile global olarak gösteriliyor. Bu, modern ve kullanıcı dostu bir hata yönetim stratejisidir.
