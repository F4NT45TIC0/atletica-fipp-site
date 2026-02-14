import styles from "./ui.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
}

export function Button({
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    children,
    disabled,
    className = "",
    ...props
}: ButtonProps) {
    return (
        <button
            className={`${styles.btn} ${styles[`btn-${variant}`]} ${styles[`btn-${size}`]} ${fullWidth ? styles["btn-full"] : ""} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <span className={styles.spinner} />}
            {children}
        </button>
    );
}
