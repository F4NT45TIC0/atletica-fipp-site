import styles from "./ui.module.css";

interface BadgeProps {
    variant?: "default" | "success" | "warning" | "danger" | "info";
    children: React.ReactNode;
}

export function Badge({ variant = "default", children }: BadgeProps) {
    return (
        <span className={`${styles.badge} ${styles[`badge-${variant}`]}`}>
            {children}
        </span>
    );
}
