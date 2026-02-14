import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const cookieStore = await cookies();

    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                },
            },
        }
    );

    // Check if the requester is a presidente
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Check role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, org_id")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "presidente") {
        return NextResponse.json(
            { error: "Apenas o presidente pode criar membros" },
            { status: 403 }
        );
    }

    if (!profile?.org_id) {
        return NextResponse.json(
            { error: "Presidente não pertence a nenhuma organização" },
            { status: 400 }
        );
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
        return NextResponse.json(
            { error: "Nome, e-mail e senha são obrigatórios" },
            { status: 400 }
        );
    }

    if (password.length < 6) {
        return NextResponse.json(
            { error: "Senha deve ter pelo menos 6 caracteres" },
            { status: 400 }
        );
    }

    // Create auth user using admin API
    const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role: "membro" },
        });

    if (createError) {
        return NextResponse.json(
            { error: createError.message },
            { status: 400 }
        );
    }

    // The profile should be created by the trigger, but update if needed
    await supabase
        .from("profiles")
        .upsert({
            id: newUser.user.id,
            email,
            name,
            role: "membro",
            org_id: profile.org_id,
        });

    return NextResponse.json({ success: true, userId: newUser.user.id });
}
