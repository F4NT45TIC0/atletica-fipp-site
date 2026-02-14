import styles from "./ui.module.css";

interface TagProps {
    label: string;
    color?: string;
    removable?: boolean;
    onRemove?: () => void;
}

export function Tag({ label, color = "#3B82F6", removable = false, onRemove }: TagProps) {
    return (
        <span
            className={styles.tag}
            style={{
                backgroundColor: `${color}18`,
                color: color,
                borderColor: `${color}40`,
            }}
        >
            {label}
            {removable && (
                <button
                    className={styles["tag-remove"]}
                    onClick={onRemove}
                    aria-label={`Remover tag ${label}`}
                    style={{ color }}
                >
                    ×
                </button>
            )}
        </span>
    );
}
