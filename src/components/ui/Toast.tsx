"use client";

import { useEffect, useState } from "react";
import styles from "./ui.module.css";

interface ToastProps {
    message: string;
    type?: "success" | "error" | "info" | "warning";
    duration?: number;
    onClose: () => void;
}

export function Toast({
    message,
    type = "info",
    duration = 4000,
    onClose,
}: ToastProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons: Record<string, string> = {
        success: "✓",
        error: "✕",
        info: "ℹ",
        warning: "⚠",
    };

    return (
        <div
            className={`${styles.toast} ${styles[`toast-${type}`]} ${!visible ? styles["toast-exit"] : ""}`}
            role="alert"
        >
            <span className={styles["toast-icon"]}>{icons[type]}</span>
            <span className={styles["toast-message"]}>{message}</span>
            <button
                className={styles["toast-close"]}
                onClick={() => {
                    setVisible(false);
                    setTimeout(onClose, 300);
                }}
                aria-label="Fechar"
            >
                ✕
            </button>
        </div>
    );
}

// Toast container for multiple toasts
interface ToastItem {
    id: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
}

export function ToastContainer({
    toasts,
    onRemove,
}: {
    toasts: ToastItem[];
    onRemove: (id: string) => void;
}) {
    return (
        <div className={styles["toast-container"]}>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </div>
    );
}
