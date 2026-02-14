import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    // Public routes — skip auth entirely (no Supabase call needed)
    const isPublicRoute =
        request.nextUrl.pathname === "/" ||
        request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/a/") ||
        request.nextUrl.pathname.startsWith("/pricing") ||
        request.nextUrl.pathname.startsWith("/signup") ||
        request.nextUrl.pathname.startsWith("/invite/") ||
        request.nextUrl.pathname.startsWith("/api/");

    if (isPublicRoute && !request.nextUrl.pathname.startsWith("/login")) {
        return supabaseResponse;
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // If not logged in and not on a public route, redirect to /login
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // If logged in and on /login page, redirect to /dashboard
    if (user && request.nextUrl.pathname.startsWith("/login")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
