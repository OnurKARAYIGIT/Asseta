import React from "react";
import { FaBell } from "react-icons/fa";

const NotificationSettings = ({ settings, onSettingChange }) => {
  return (
    <div className="settings-card">
      <h2>Bildirim Tercihleri</h2>
      <div className="setting-item">
        <div className="setting-label">
          <FaBell style={{ marginRight: "10px", color: "#3498db" }} />
          Yeni zimmet atandığında e-posta ile bildir
        </div>
        <div className="setting-control">
          <label className="theme-switch">
            <input
              name="emailOnNewAssignment"
              type="checkbox"
              onChange={onSettingChange}
              checked={settings.emailOnNewAssignment}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
      <div className="setting-item">
        <div className="setting-label">
          <FaBell style={{ marginRight: "10px", color: "#3498db" }} />
          Zimmet durumu değiştiğinde e-posta ile bildir
          <p className="setting-description">
            Onay, ret veya iade durumlarında bildirim alırsınız.
          </p>
        </div>
        <div className="setting-control">
          <label className="theme-switch">
            <input
              name="emailOnStatusChange"
              type="checkbox"
              onChange={onSettingChange}
              checked={settings.emailOnStatusChange}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
