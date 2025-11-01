import React from "react";
import { FaUsersCog, FaUserPlus } from "react-icons/fa";
import Button from "../shared/Button";

const AdminToolbar = ({ onAddNewUser }) => {
  return (
    // Bu bileşen artık sadece araç çubuğu işlevlerini (arama, filtre vb.) içerecek.
    // Başlık ve "Yeni Ekle" butonu, sayfanın ana düzenine taşındı.
    // Şimdilik bu bileşen boş kalabilir veya gelecekte eklenecek
    // arama/filtreleme özellikleri için bir iskelet olarak bırakılabilir.
    // Bu örnekte, başlık ve butonu doğrudan AdminPage.jsx'e taşıdığımız için
    // bu bileşenin içeriğini kaldırıyoruz.
    // Eğer gelecekte bir arama çubuğu eklenirse, buraya eklenecektir.
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
      {/* 
        Örnek: Gelecekte buraya bir arama çubuğu eklenebilir.
        <input type="text" placeholder="Kullanıcı ara..." className="input-class" />
      */}
    </div>
  );
};

export default AdminToolbar;
