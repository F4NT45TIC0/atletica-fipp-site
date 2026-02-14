"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { AuthProvider } from "@/lib/providers/AuthProvider";
import { NotificationProvider } from "@/lib/providers/NotificationProvider";
import { ToastProvider, useToast } from "@/lib/hooks/useToast";
import { ToastContainer } from "@/components/ui";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import styles from "@/components/layout/layout.module.css";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/vendas": "Vendas",
    "/vendas/nova": "Nova Venda",
    "/estoque": "Estoque",
    "/estoque/novo": "Novo Produto",
    "/entregas": "Entregas",
    "/notificacoes": "Notificações",
    "/membros": "Membros",
    "/configurar": "Minha Landing",
};

function ProtectedContent({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, loading } = useAuth();
    const { toasts, removeToast } = useToast();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [loading, user, router]);

    if (loading || !user) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingSpinner} />
            </div>
        );
    }

    const pageTitle =
        PAGE_TITLES[pathname] ||
        Object.entries(PAGE_TITLES).find(([path]) =>
            pathname.startsWith(path + "/")
        )?.[1] ||
        "Atlétics";

    return (
        <NotificationProvider userId={user.id}>
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <Header
                title={pageTitle}
                onMenuClick={() => setSidebarOpen(true)}
            />
            <main className={styles.main}>
                <div className={styles.pageContent}>{children}</div>
            </main>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </NotificationProvider>
    );
}

export default function ProtectedShell({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <ToastProvider>
                <ProtectedContent>{children}</ProtectedContent>
            </ToastProvider>
        </AuthProvider>
    );
}
