import React from "react";
import { FaKey, FaShieldAlt } from "react-icons/fa";
import Button from "../shared/Button";

const AccountSecurity = ({ onChangePasswordClick }) => {
  return (
    <div className="border-t border-border-color pt-8">
      <div className="flex items-start gap-4">
        <FaShieldAlt className="text-secondary text-xl mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-main">
            Hesap ve Güvenlik
          </h3>
          <p className="text-sm text-text-light mt-1">
            Hesap şifrenizi yönetin ve ek güvenlik önlemleri alın.
          </p>
          <div className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-medium text-text-main">
                  Şifre Değiştir
                </span>
                <p className="text-sm text-text-light">
                  Güvenliğiniz için şifrenizi periyodik olarak değiştirin.
                </p>
              </div>
              <Button
                onClick={onChangePasswordClick}
                variant="secondary"
                className="mt-2 sm:mt-0"
              >
                Şifreyi Değiştir
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-medium text-text-main">
                  İki Faktörlü Kimlik Doğrulama (2FA)
                </span>
                <p className="text-sm text-text-light">
                  Hesabınıza ekstra bir güvenlik katmanı ekleyin.
                </p>
              </div>
              <Button variant="secondary" disabled className="mt-2 sm:mt-0">
                Etkinleştir (Yakında)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSecurity;
