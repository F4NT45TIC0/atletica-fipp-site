import styles from "./ui.module.css";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: "sm" | "md" | "lg";
    hover?: boolean;
    onClick?: () => void;
}

export function Card({
    children,
    className = "",
    padding = "md",
    hover = false,
    onClick,
}: CardProps) {
    return (
        <div
            className={`${styles.card} ${styles[`card-${padding}`]} ${hover ? styles["card-hover"] : ""} ${className}`}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
}
