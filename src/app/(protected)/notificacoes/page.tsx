"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { Button, Badge, Card } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils/format";
import styles from "./notificacoes.module.css";

export default function NotificacoesPage() {
    const { user } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);
    const router = useRouter();

    const typeIcons: Record<string, string> = {
        erro: "⚠️",
        info: "ℹ️",
        entrega: "🚚",
        venda: "🛒",
    };

    const typeLabels: Record<string, string> = {
        erro: "Erro Reportado",
        info: "Informação",
        entrega: "Entrega",
        venda: "Venda",
    };

    function handleNotifClick(notif: { id: string; read: boolean; sale_id: string | null }) {
        // Mark as read if unread
        if (!notif.read) markAsRead(notif.id);

        // Navigate to the related sale if there's a sale_id
        if (notif.sale_id) {
            router.push(`/vendas/${notif.sale_id}`);
        }
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div>
                    <p className={styles.pageSubtitle}>
                        {unreadCount > 0 ? `${unreadCount} não lidas` : "Tudo em dia"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                        Marcar todas como lidas
                    </Button>
                )}
            </div>

            {/* Notifications */}
            {notifications.length === 0 ? (
                <Card>
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>🔔</span>
                        <h3>Nenhuma notificação</h3>
                        <p>Você será notificado sobre erros reportados e atualizações</p>
                    </div>
                </Card>
            ) : (
                <div className={styles.notifList}>
                    {notifications.map((notif) => (
                        <Card
                            key={notif.id}
                            className={`${styles.notifCard} ${!notif.read ? styles.notifUnread : ""} ${notif.sale_id ? styles.notifClickable : ""}`}
                            onClick={() => handleNotifClick(notif)}
                        >
                            <div className={styles.notifIcon}>
                                {typeIcons[notif.type] || "🔔"}
                            </div>
                            <div className={styles.notifContent}>
                                <div className={styles.notifTop}>
                                    <Badge variant={notif.type === "erro" ? "danger" : "info"}>
                                        {typeLabels[notif.type] || notif.type}
                                    </Badge>
                                    <span className={styles.notifTime}>
                                        {formatRelativeTime(notif.created_at)}
                                    </span>
                                </div>
                                <p className={styles.notifMessage}>{notif.message}</p>
                                {notif.sale_id && (
                                    <span className={styles.notifLink}>
                                        Ver venda →
                                    </span>
                                )}
                                {!notif.read && (
                                    <div className={styles.notifDot} />
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
