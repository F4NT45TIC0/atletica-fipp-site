"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import styles from "./invite.module.css";

interface InviteData {
    id: string;
    code: string;
    role: string;
    email: string | null;
    expires_at: string | null;
    organizations: {
        name: string;
        slug: string;
    } | null;
}

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params);
    const supabase = createClient();

    const [invite, setInvite] = useState<InviteData | null>(null);
    const [loadingInvite, setLoadingInvite] = useState(true);
    const [invalid, setInvalid] = useState(false);
    const [invalidMessage, setInvalidMessage] = useState("");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        async function fetchInvite() {
            const { data, error: fetchErr } = await supabase
                .from("invites")
                .select("id, code, role, email, expires_at, organizations(name, slug)")
                .eq("code", code)
                .is("used_by", null)
                .maybeSingle();

            if (fetchErr || !data) {
                setInvalid(true);
                setInvalidMessage("Convite não encontrado ou já utilizado.");
                setLoadingInvite(false);
                return;
            }

            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                setInvalid(true);
                setInvalidMessage("Este convite expirou.");
                setLoadingInvite(false);
                return;
            }

            setInvite(data as InviteData);
            if (data.email) {
                setEmail(data.email);
            }
            setLoadingInvite(false);
        }

        fetchInvite();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!name.trim() || !email.trim() || !password) {
            setError("Todos os campos são obrigatórios");
            return;
        }

        if (password.length < 6) {
            setError("Senha deve ter pelo menos 6 caracteres");
            return;
        }

        if (password !== confirmPassword) {
            setError("As senhas não coincidem");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/accept-invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    name: name.trim(),
                    email: email.trim(),
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erro ao aceitar convite");
            }

            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao aceitar convite");
        }

        setLoading(false);
    }

    if (loadingInvite) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner} />
                        <p className={styles.loadingText}>Verificando convite...</p>
                    </div>
                </div>
                <div className={styles.bgDecor}>
                    <div className={styles.bgCircle1} />
                    <div className={styles.bgCircle2} />
                </div>
            </div>
        );
    }

    if (invalid || !invite) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.invalidState}>
                        <div className={styles.invalidIcon}>😕</div>
                        <h2 className={styles.invalidTitle}>Convite Inválido</h2>
                        <p className={styles.invalidText}>{invalidMessage}</p>
                        <Link href="/" className={styles.linkButton}>
                            ← Voltar ao site
                        </Link>
                    </div>
                </div>
                <div className={styles.bgDecor}>
                    <div className={styles.bgCircle1} />
                    <div className={styles.bgCircle2} />
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.success}>
                        <div className={styles.successIcon}>✓</div>
                        <h2 className={styles.successTitle}>Conta criada!</h2>
                        <p className={styles.successText}>
                            Você agora faz parte da{" "}
                            <strong>{invite.organizations?.name}</strong>.
                            <br />
                            Faça login para acessar o painel.
                        </p>
                        <Link href="/login" className={styles.successLink}>
                            Fazer Login →
                        </Link>
                    </div>
                </div>
                <div className={styles.bgDecor}>
                    <div className={styles.bgCircle1} />
                    <div className={styles.bgCircle2} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <span className={styles.logoIcon}>⚡</span>
                        <h1 className={styles.logoText}>Atlétics</h1>
                    </div>
                    <p className={styles.subtitle}>Você foi convidado!</p>
                </div>

                <div className={styles.inviteInfo}>
                    <p className={styles.inviteOrg}>{invite.organizations?.name}</p>
                    <p className={styles.inviteRole}>
                        Cargo: {invite.role === "presidente" ? "Presidente" : "Membro"}
                    </p>
                </div>

                {error && (
                    <div className={styles.error} style={{ marginBottom: "var(--space-4)" }}>
                        <span>✕</span> {error}
                    </div>
                )}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label className={styles.label}>Seu Nome *</label>
                        <input
                            className={styles.input}
                            placeholder="Nome completo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>E-mail *</label>
                        <input
                            className={styles.input}
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            readOnly={!!invite.email}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Senha *</label>
                        <input
                            className={styles.input}
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Confirmar Senha *</label>
                        <input
                            className={styles.input}
                            type="password"
                            placeholder="Repita a senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? <span className={styles.spinner} /> : "Criar Conta e Entrar"}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>
                        Já tem uma conta?{" "}
                        <Link href="/login">Fazer login</Link>
                    </p>
                </div>
            </div>

            <div className={styles.bgDecor}>
                <div className={styles.bgCircle1} />
                <div className={styles.bgCircle2} />
            </div>
        </div>
    );
}
