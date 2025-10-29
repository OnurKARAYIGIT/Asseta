import React from "react";

const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  // Temel stiller
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 ease-in-out";

  // Boyut sınıfları
  const sizeClasses =
    {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    }[size] || "px-4 py-2 text-base";

  // Varyant sınıfları
  const variantClasses =
    {
      primary:
        "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover/90 focus:ring-2 focus:ring-primary/20",
      secondary:
        "bg-light-gray text-text-main hover:bg-gray-200 active:bg-gray-200/90 focus:ring-2 focus:ring-gray-200/20",
      danger:
        "bg-danger text-white hover:bg-danger/90 active:bg-danger/80 focus:ring-2 focus:ring-danger/20",
      text: "bg-transparent text-text-main hover:bg-light-gray active:bg-light-gray/90",
      outline:
        "bg-transparent border border-border text-text-main hover:bg-light-gray active:bg-light-gray/90",
      excel:
        "bg-[#1D6F42] text-white hover:bg-[#165934] active:bg-[#165934]/90 focus:ring-2 focus:ring-green-500/20",
    }[variant] || "bg-primary text-white hover:bg-primary-hover";

  // Disabled durumu
  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : "transform active:scale-[0.98]";

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${disabledClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
