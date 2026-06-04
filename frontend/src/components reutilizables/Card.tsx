import React from "react";
import styles from "./components.module.css";

interface CardProps {
  title: string;
  description: string;
  icon?: string; // Boxicon name, e.g. "bx-brain"
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  description,
  icon,
  onClick,
  className = "",
  children,
}) => {
  return (
    <div
      className={`${styles.card} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div>
        {icon && (
          <div className={styles.cardIcon}>
            <i className={`bx ${icon}`}></i>
          </div>
        )}
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>
      </div>
      {children}
    </div>
  );
};

export default Card;
