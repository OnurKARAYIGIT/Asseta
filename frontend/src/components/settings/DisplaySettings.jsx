import React from "react";
import { FaListUl } from "react-icons/fa";

const DisplaySettings = ({ settings, onSettingChange }) => {
  return (
    <div className="border-t border-border-color pt-8">
      <div className="flex items-start gap-4">
        <FaListUl className="text-secondary text-xl mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-main">
            Liste Görünümü
          </h3>
          <p className="text-sm text-text-light mt-1">
            Listeleme sayfalarında bir sayfada kaç adet kayıt gösterileceğini
            belirleyin.
          </p>
          <div className="mt-4">
            <select
              id="itemsPerPage"
              name="itemsPerPage"
              value={settings.itemsPerPage}
              onChange={onSettingChange}
              className="w-full max-w-xs bg-background-color border border-border-color text-text-main rounded-md p-2 focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value={15}>15 Kayıt</option>
              <option value={25}>25 Kayıt</option>
              <option value={50}>50 Kayıt</option>
              <option value={100}>100 Kayıt</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplaySettings;
