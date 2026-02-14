import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, name, email, password } = body;

        if (!code?.trim() || !name?.trim() || !email?.trim() || !password) {
            return NextResponse.json(
                { error: "Todos os campos são obrigatórios" },
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

        // 1. Find the invite
        const { data: invite, error: inviteError } = await supabase
            .from("invites")
            .select("*, organizations(name, slug)")
            .eq("code", code.trim())
            .is("used_by", null)
            .maybeSingle();

        if (inviteError || !invite) {
            return NextResponse.json(
                { error: "Convite inválido ou já utilizado" },
                { status: 404 }
            );
        }

        // Check if expired
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            return NextResponse.json(
                { error: "Este convite expirou" },
                { status: 410 }
            );
        }

        // Check email match if invite has a specific email
        if (invite.email && invite.email.toLowerCase() !== email.trim().toLowerCase()) {
            return NextResponse.json(
                { error: "Este convite é destinado a outro e-mail" },
                { status: 403 }
            );
        }

        // 2. Check if email is already registered
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

        // 3. Create the auth user
        const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
            email: email.trim(),
            password,
            email_confirm: true,
            user_metadata: {
                name: name.trim(),
                role: invite.role || "membro",
                org_id: invite.org_id,
            },
        });

        if (userError) {
            console.error("User creation error:", userError);
            return NextResponse.json(
                { error: "Erro ao criar usuário: " + userError.message },
                { status: 500 }
            );
        }

        // 4. Create the profile
        const { error: profileError } = await supabase
            .from("profiles")
            .insert({
                id: newUser.user.id,
                email: email.trim(),
                name: name.trim(),
                role: invite.role || "membro",
                org_id: invite.org_id,
            });

        if (profileError) {
            await supabase.auth.admin.deleteUser(newUser.user.id);
            console.error("Profile creation error:", profileError);
            return NextResponse.json(
                { error: "Erro ao criar perfil: " + profileError.message },
                { status: 500 }
            );
        }

        // 5. Mark invite as used
        await supabase
            .from("invites")
            .update({
                used_by: newUser.user.id,
                used_at: new Date().toISOString(),
            })
            .eq("id", invite.id);

        return NextResponse.json({
            success: true,
            orgSlug: invite.organizations?.slug,
        });
    } catch (err) {
        console.error("Accept invite error:", err);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
