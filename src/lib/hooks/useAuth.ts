"use client";

import { useAuthContext } from "@/lib/providers/AuthProvider";

export function useAuth() {
    return useAuthContext();
}
