import { forwardRef } from "react";
import styles from "./ui.module.css";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, placeholder, id, className = "", ...props }, ref) => {
        const selectId = id || label?.toLowerCase().replace(/\s/g, "-");

        return (
            <div className={styles["form-group"]}>
                {label && (
                    <label htmlFor={selectId} className={styles["form-label"]}>
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={`${styles["form-input"]} ${styles["form-select"]} ${error ? styles["form-input-error"] : ""} ${className}`}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <span className={styles["form-error"]}>{error}</span>}
            </div>
        );
    }
);

Select.displayName = "Select";
