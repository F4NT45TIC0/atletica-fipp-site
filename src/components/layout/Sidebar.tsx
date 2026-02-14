"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import styles from "./layout.module.css";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: "📊", roles: ["presidente", "membro"] },
    { href: "/vendas", label: "Vendas", icon: "🛒", roles: ["presidente", "membro"] },
    { href: "/estoque", label: "Estoque", icon: "📦", roles: ["presidente", "membro"] },
    { href: "/entregas", label: "Entregas", icon: "🚚", roles: ["presidente", "membro"] },
    { href: "/notificacoes", label: "Notificações", icon: "🔔", roles: ["presidente", "membro"] },
    { href: "/membros", label: "Membros", icon: "👥", roles: ["presidente"] },
    { href: "/configurar", label: "Minha Landing", icon: "🎨", roles: ["presidente"] },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user, organization, signOut } = useAuth();

    const filteredItems = NAV_ITEMS.filter(
        (item) => user && item.roles.includes(user.role)
    );

    return (
        <>
            {/* Mobile overlay */}
            {open && <div className={styles.overlay} onClick={onClose} />}

            <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
                {/* Logo */}
                <div className={styles.sidebarLogo}>
                    <span className={styles.sidebarLogoIcon}>⚡</span>
                    <span className={styles.sidebarLogoText}>{organization?.name || "Atlétics"}</span>
                </div>

                {/* Navigation */}
                <nav className={styles.sidebarNav}>
                    {filteredItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                                onClick={onClose}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                <span className={styles.navLabel}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className={styles.userDetails}>
                            <span className={styles.userName}>{user?.name || "Carregando..."}</span>
                            <span className={styles.userRole}>
                                {user?.role === "presidente" ? "Presidente" : "Membro"}
                            </span>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={signOut} title="Sair">
                        ↪
                    </button>
                </div>
            </aside>
        </>
    );
}
