"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types";

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (notifId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refetch: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({
    userId,
    children,
}: {
    userId: string | undefined;
    children: React.ReactNode;
}) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const supabase = createClient();

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;

        const { data } = await supabase
            .from("notifications")
            .select("*, from_user_data:profiles!notifications_from_user_fkey(*)")
            .eq("to_user", userId)
            .order("created_at", { ascending: false })
            .limit(50);

        if (data) {
            setNotifications(data as unknown as Notification[]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setUnreadCount((data as any[]).filter((n) => !n.read).length);
        }
    }, [userId, supabase]);

    useEffect(() => {
        // eslint-disable-next-line
        fetchNotifications();

        if (!userId) return;

        const channel = supabase
            .channel("notifications-realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `to_user=eq.${userId}`,
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (payload: any) => {
                    const newNotif = payload.new as Notification;
                    setNotifications((prev) => [newNotif, ...prev]);
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase, fetchNotifications]);

    const markAsRead = useCallback(async (notifId: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notifId);
    }, [supabase]);

    const markAllAsRead = useCallback(async () => {
        if (!userId) return;

        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);

        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("to_user", userId)
            .eq("read", false);
    }, [userId, supabase]);

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, markAsRead, markAllAsRead, refetch: fetchNotifications }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotificationContext must be used within NotificationProvider");
    return ctx;
}
