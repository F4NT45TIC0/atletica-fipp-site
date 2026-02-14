import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("organizations")
            .select("slug, name, logo_url, primary_color, secondary_color, accent_color, hero_subtitle, subscription_status")
            .in("subscription_status", ["trial", "active"])
            .order("created_at", { ascending: false })
            .limit(12);

        if (error) {
            console.error("Orgs API error:", error);
            return NextResponse.json({ orgs: [] });
        }

        return NextResponse.json({ orgs: data || [] });
    } catch (err) {
        console.error("Orgs API catch:", err);
        return NextResponse.json({ orgs: [] });
    }
}
