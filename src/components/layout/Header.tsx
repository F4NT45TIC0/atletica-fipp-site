"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications } from "@/lib/hooks/useNotifications";
import Link from "next/link";
import styles from "./layout.module.css";

interface HeaderProps {
    title: string;
    onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
    const { user } = useAuth();
    const { unreadCount } = useNotifications(user?.id);

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <button
                    className={styles.menuBtn}
                    onClick={onMenuClick}
                    aria-label="Menu"
                >
                    ☰
                </button>
                <h1 className={styles.headerTitle}>{title}</h1>
            </div>

            <div className={styles.headerRight}>
                <Link href="/notificacoes" className={styles.notifBtn}>
                    🔔
                    {unreadCount > 0 && (
                        <span className={styles.notifBadge}>
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
}
