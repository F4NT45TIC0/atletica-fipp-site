import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import type { Organization } from "@/lib/types";
import OrgLandingClient from "./OrgLandingClient";

// Disable caching so edits from the configurar page show immediately
export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const supabase = createAdminClient();

    const { data: org } = await supabase
        .from("organizations")
        .select("name, hero_subtitle")
        .eq("slug", slug)
        .single();

    if (!org) return { title: "Não encontrado" };

    return {
        title: `${org.name} — Atlétics`,
        description: org.hero_subtitle || `Produtos da ${org.name}`,
    };
}

export default async function OrgLandingPage({ params }: Props) {
    const { slug } = await params;
    const supabase = createAdminClient();

    // Buscar organização
    const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug)
        .single();

    if (!org) notFound();

    // Verificar se a assinatura está ativa
    const orgData = org as Organization;
    const isActive = ["trial", "active"].includes(orgData.subscription_status);

    if (!isActive) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0a0e1a",
                color: "#fff",
                fontFamily: "var(--font-inter), sans-serif",
            }}>
                <div style={{ textAlign: "center" }}>
                    <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                        {orgData.name}
                    </h1>
                    <p style={{ color: "#94a3b8" }}>
                        Esta página está temporariamente indisponível.
                    </p>
                </div>
            </div>
        );
    }

    // Buscar produtos ativos da org
    const { data: products } = await supabase
        .from("products")
        .select("id, name, type, size, price, description")
        .eq("org_id", org.id)
        .eq("active", true)
        .order("name");

    return (
        <OrgLandingClient
            org={orgData}
            products={products || []}
        />
    );
}
