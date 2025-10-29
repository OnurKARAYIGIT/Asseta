import React from "react";
import { FaBell } from "react-icons/fa";

const ToggleSwitch = ({ name, checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-primary-hover rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
  </label>
);

const NotificationSettings = ({ settings, onSettingChange }) => {
  return (
    <div className="border-t border-border-color pt-8">
      <div className="flex items-start gap-4">
        <FaBell className="text-secondary text-xl mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-main">
            Bildirim Tercihleri
          </h3>
          <p className="text-sm text-text-light mt-1">
            Hangi durumlarda e-posta bildirimi almak istediğinizi seçin.
          </p>
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-medium text-text-main">
                Yeni zimmet atandığında
              </span>
              <ToggleSwitch
                name="emailOnNewAssignment"
                checked={settings.emailOnNewAssignment}
                onChange={onSettingChange}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-text-main">
                  Zimmet durumu değiştiğinde
                </span>
                <p className="text-sm text-text-light">
                  Onay, ret veya iade durumlarında bildirim alırsınız.
                </p>
              </div>
              <ToggleSwitch
                name="emailOnStatusChange"
                checked={settings.emailOnStatusChange}
                onChange={onSettingChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
