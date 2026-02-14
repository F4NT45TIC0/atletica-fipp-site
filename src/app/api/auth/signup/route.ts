import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orgName, slug, email, password, presidentName } = body;

        // Validate
        if (!orgName?.trim() || !slug?.trim() || !email?.trim() || !password || !presidentName?.trim()) {
            return NextResponse.json(
                { error: "Todos os campos são obrigatórios" },
                { status: 400 }
            );
        }

        const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
        if (cleanSlug.length < 2) {
            return NextResponse.json(
                { error: "Slug deve ter pelo menos 2 caracteres" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Senha deve ter pelo menos 6 caracteres" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Check if slug is available
        const { data: existingOrg } = await supabase
            .from("organizations")
            .select("id")
            .eq("slug", cleanSlug)
            .maybeSingle();

        if (existingOrg) {
            return NextResponse.json(
                { error: "Esse slug já está em uso. Tente outro." },
                { status: 409 }
            );
        }

        // Check if email is already registered
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const emailExists = existingUsers?.users?.some(
            (u: { email?: string }) => u.email?.toLowerCase() === email.trim().toLowerCase()
        );
        if (emailExists) {
            return NextResponse.json(
                { error: "Esse e-mail já está cadastrado. Faça login." },
                { status: 409 }
            );
        }

        // 1. Create the organization
        const { data: org, error: orgError } = await supabase
            .from("organizations")
            .insert({
                name: orgName.trim(),
                slug: cleanSlug,
                hero_title: orgName.trim().toUpperCase(),
            })
            .select("id")
            .single();

        if (orgError) {
            console.error("Org creation error:", orgError);
            return NextResponse.json(
                { error: "Erro ao criar organização: " + orgError.message },
                { status: 500 }
            );
        }

        // 2. Create the auth user
        const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
            email: email.trim(),
            password,
            email_confirm: true,
            user_metadata: {
                name: presidentName.trim(),
                role: "presidente",
                org_id: org.id,
            },
        });

        if (userError) {
            // Rollback: delete the org
            await supabase.from("organizations").delete().eq("id", org.id);
            console.error("User creation error:", userError);
            return NextResponse.json(
                { error: "Erro ao criar usuário: " + userError.message },
                { status: 500 }
            );
        }

        // 3. Create the profile
        const { error: profileError } = await supabase
            .from("profiles")
            .insert({
                id: newUser.user.id,
                email: email.trim(),
                name: presidentName.trim(),
                role: "presidente",
                org_id: org.id,
            });

        if (profileError) {
            // Rollback
            await supabase.auth.admin.deleteUser(newUser.user.id);
            await supabase.from("organizations").delete().eq("id", org.id);
            console.error("Profile creation error:", profileError);
            return NextResponse.json(
                { error: "Erro ao criar perfil: " + profileError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            orgId: org.id,
            slug: cleanSlug,
        });
    } catch (err) {
        console.error("Signup error:", err);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
