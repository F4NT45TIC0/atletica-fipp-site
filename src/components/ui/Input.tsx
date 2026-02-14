import { forwardRef } from "react";
import styles from "./ui.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, id, className = "", ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

        return (
            <div className={styles["form-group"]}>
                {label && (
                    <label htmlFor={inputId} className={styles["form-label"]}>
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`${styles["form-input"]} ${error ? styles["form-input-error"] : ""} ${className}`}
                    {...props}
                />
                {error && <span className={styles["form-error"]}>{error}</span>}
                {hint && !error && <span className={styles["form-hint"]}>{hint}</span>}
            </div>
        );
    }
);

Input.displayName = "Input";
