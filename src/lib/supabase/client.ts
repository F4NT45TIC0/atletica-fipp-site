import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (_client) return _client;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    // During SSR prerender or build, env vars may not be real URLs.
    // Return a dummy client that won't crash — it will be re-created on the browser.
    if (!url.startsWith("http")) {
        // In browser, this should never happen since env vars are inlined at build.
        // On server during prerender without valid env, use placeholder that won't crash.
        return createBrowserClient(
            "https://placeholder.supabase.co",
            "placeholder-key"
        );
    }

    _client = createBrowserClient(url, key);
    return _client;
}
