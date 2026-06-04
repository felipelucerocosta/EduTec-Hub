import React from "react";
import styles from "./components.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  loading?: boolean;
  icon?: string; // Boxicon name, e.g. "bx-log-in"
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  loading = false,
  icon,
  className = "",
  disabled,
  ...props
}) => {
  // Map variant to style module class
  let variantClass = styles.btnPrimary;
  if (variant === "secondary") variantClass = styles.btnSecondary;
  if (variant === "outline") variantClass = styles.btnOutline;
  if (variant === "danger") variantClass = styles.btnDanger;

  return (
    <button
      className={`${styles.btn} ${variantClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <i className="bx bx-loader-alt bx-spin" style={{ fontSize: "1.1rem" }}></i>
      ) : icon ? (
        <i className={`bx ${icon}`} style={{ fontSize: "1.1rem" }}></i>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
