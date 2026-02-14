"use client";

import { useEffect, useRef } from "react";
import styles from "./ui.module.css";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg";
}

export function Modal({
    open,
    onClose,
    title,
    children,
    size = "md",
}: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (open) {
            dialog.showModal();
        } else {
            dialog.close();
        }
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleClose = () => onClose();
        dialog.addEventListener("close", handleClose);
        return () => dialog.removeEventListener("close", handleClose);
    }, [onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === dialogRef.current) {
            onClose();
        }
    };

    return (
        <dialog
            ref={dialogRef}
            className={`${styles.modal} ${styles[`modal-${size}`]}`}
            onClick={handleBackdropClick}
        >
            <div className={styles["modal-content"]}>
                <div className={styles["modal-header"]}>
                    <h2 className={styles["modal-title"]}>{title}</h2>
                    <button
                        className={styles["modal-close"]}
                        onClick={onClose}
                        aria-label="Fechar"
                    >
                        ✕
                    </button>
                </div>
                <div className={styles["modal-body"]}>{children}</div>
            </div>
        </dialog>
    );
}
