import React from "react";
import styles from "./components.module.css";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string; // Boxicon name, e.g. "bx-user"
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  icon,
  error,
  className = "",
  type = "text",
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={styles.inputWrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.inputLabel}>
          {label}
        </label>
      )}
      <div className={styles.inputContainer}>
        {icon && (
          <div className={styles.inputIcon}>
            <i className={`bx ${icon}`}></i>
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`${styles.inputField} ${icon ? styles.inputFieldWithIcon : ""} ${
            error ? styles.inputFieldInvalid : ""
          } ${className}`}
          {...props}
        />
      </div>
      {error && <span className={styles.inputErrorText}>{error}</span>}
    </div>
  );
};

export default InputField;
