import React from "react";
import { FaKey, FaShieldAlt } from "react-icons/fa";

const AccountSecurity = ({ onNavigateToProfile }) => {
  return (
    <div className="settings-card">
      <h2>Hesap ve Güvenlik</h2>
      <div className="setting-item">
        <div className="setting-label">
          <FaKey style={{ marginRight: "10px", color: "#e67e22" }} />
          Şifre Değiştir
          <p className="setting-description">
            Güvenliğiniz için şifrenizi periyodik olarak değiştirin.
          </p>
        </div>
        <div className="setting-control">
          <button className="secondary-button" onClick={onNavigateToProfile}>
            Şifreyi Değiştir
          </button>
        </div>
      </div>
      <div className="setting-item">
        <div className="setting-label">
          <FaShieldAlt style={{ marginRight: "10px", color: "#e74c3c" }} />
          İki Faktörlü Kimlik Doğrulama (2FA)
          <p className="setting-description">
            Hesabınıza ekstra bir güvenlik katmanı ekleyin.
          </p>
        </div>
        <div className="setting-control">
          <button className="secondary-button" disabled>
            Etkinleştir (Yakında)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSecurity;
