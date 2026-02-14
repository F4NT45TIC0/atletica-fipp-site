"use client";

import { useNotificationContext } from "@/lib/providers/NotificationProvider";

/**
 * @param _userId - kept for API compatibility, ignored (context handles userId)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useNotifications(_userId?: string | undefined) {
    return useNotificationContext();
}
