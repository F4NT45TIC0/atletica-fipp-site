"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Organization } from "@/lib/types";

interface AuthContextType {
    user: User | null;
    organization: Organization | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshOrganization: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const fetchProfile = useCallback(async (userId: string) => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (data) {
            setUser(data as User);

            // Buscar organização do usuário
            if (data.org_id) {
                const { data: orgData } = await supabase
                    .from("organizations")
                    .select("*")
                    .eq("id", data.org_id)
                    .single();

                if (orgData) setOrganization(orgData as Organization);
            }
        }
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase.auth.getUser().then((result: any) => {
            const authUser = result?.data?.user;
            if (authUser) {
                fetchProfile(authUser.id);
            } else {
                setLoading(false);
            }
        });

        const {
            data: { subscription },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setUser(null);
                setOrganization(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setOrganization(null);
        window.location.href = "/login";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refreshOrganization = useCallback(async () => {
        const currentUser = user;
        if (!currentUser?.org_id) return;
        const { data: orgData } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", currentUser.org_id)
            .single();
        if (orgData) setOrganization(orgData as Organization);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, organization, loading, signOut, refreshOrganization }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
    return ctx;
}
