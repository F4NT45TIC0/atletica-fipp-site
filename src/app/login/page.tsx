"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const supabase = createClient();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError("E-mail ou senha incorretos. Tente novamente.");
            setLoading(false);
            return;
        }

        router.push("/dashboard");
        router.refresh();
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <span className={styles.logoIcon}>⚡</span>
                        <h1 className={styles.logoText}>Atlétics</h1>
                    </div>
                    <p className={styles.subtitle}>Gerenciamento de Vendas</p>
                </div>

                <form className={styles.form} onSubmit={handleLogin}>
                    {error && (
                        <div className={styles.error}>
                            <span>✕</span> {error}
                        </div>
                    )}

                    <div className={styles.field}>
                        <label htmlFor="email" className={styles.label}>
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            className={styles.input}
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password" className={styles.label}>
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className={styles.spinner} />
                        ) : (
                            "Entrar"
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>Atlétics</p>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 8 }}>
                        <Link href="/signup" style={{ color: "var(--blue-500)", fontSize: "0.85rem", textDecoration: "none", fontWeight: 500 }}>
                            Criar conta para minha atlética
                        </Link>
                        <Link href="/" style={{ color: "var(--gray-500)", fontSize: "0.8rem", textDecoration: "none" }}>
                            ← Voltar para o site
                        </Link>
                    </div>
                </div>
            </div>

            {/* Background decoration */}
            <div className={styles.bgDecor}>
                <div className={styles.bgCircle1} />
                <div className={styles.bgCircle2} />
            </div>
        </div>
    );
}
