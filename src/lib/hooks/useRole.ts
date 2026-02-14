"use client";

import { useAuth } from "./useAuth";

export function useRole() {
    const { user, loading } = useAuth();

    return {
        isPresidente: user?.role === "presidente",
        isMembro: user?.role === "membro",
        role: user?.role ?? null,
        loading,
    };
}
