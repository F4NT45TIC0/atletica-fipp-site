"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./signup.module.css";

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [resultSlug, setResultSlug] = useState("");

    // Form data
    const [orgName, setOrgName] = useState("");
    const [slug, setSlug] = useState("");
    const [presidentName, setPresidentName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    function handleOrgNameChange(value: string) {
        setOrgName(value);
        // Auto-generate slug from org name
        const autoSlug = value
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
        setSlug(autoSlug);
    }

    function handleSlugChange(value: string) {
        const clean = value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-");
        setSlug(clean);
    }

    function goToStep2(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (!orgName.trim()) {
            setError("Nome da atlética é obrigatório");
            return;
        }
        if (slug.length < 2) {
            setError("Slug deve ter pelo menos 2 caracteres");
            return;
        }
        setStep(2);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!presidentName.trim() || !email.trim() || !password) {
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
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orgName: orgName.trim(),
                    slug: slug.trim(),
                    email: email.trim(),
                    password,
                    presidentName: presidentName.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erro ao criar conta");
            }

            setResultSlug(data.slug);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao criar conta");
        }

        setLoading(false);
    }

    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.success}>
                        <div className={styles.successIcon}>✓</div>
                        <h2 className={styles.successTitle}>Atlética criada!</h2>
                        <p className={styles.successText}>
                            Sua atlética <strong>{orgName}</strong> foi criada com sucesso.
                            <br />
                            Faça login para acessar o painel e configurar sua landing page.
                        </p>
                        <Link href="/login" className={styles.successLink}>
                            Fazer Login →
                        </Link>
                        <Link
                            href={`/a/${resultSlug}`}
                            style={{
                                color: "var(--gray-500)",
                                fontSize: "0.85rem",
                                textDecoration: "none",
                                marginTop: 4,
                            }}
                        >
                            Ver Landing Page
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
                    <p className={styles.subtitle}>Crie a conta da sua atlética</p>
                </div>

                {/* Steps indicator */}
                <div className={styles.steps}>
                    <div className={`${styles.step} ${step >= 1 ? styles.active : ""}`}>
                        <span className={styles.stepDot}>1</span>
                        Atlética
                    </div>
                    <div className={styles.stepLine} />
                    <div className={`${styles.step} ${step >= 2 ? styles.active : ""}`}>
                        <span className={styles.stepDot}>2</span>
                        Presidente
                    </div>
                </div>

                {error && (
                    <div className={styles.error}>
                        <span>✕</span> {error}
                    </div>
                )}

                {step === 1 && (
                    <form className={styles.form} onSubmit={goToStep2}>
                        <div className={styles.field}>
                            <label className={styles.label}>Nome da Atlética *</label>
                            <input
                                className={styles.input}
                                placeholder="Ex: Atlética Engenharia UNESP"
                                value={orgName}
                                onChange={(e) => handleOrgNameChange(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Slug (URL) *</label>
                            <input
                                className={styles.input}
                                placeholder="atletica-engenharia"
                                value={slug}
                                onChange={(e) => handleSlugChange(e.target.value)}
                                required
                                minLength={2}
                            />
                            {slug && (
                                <p className={styles.slugPreview}>
                                    Sua landing page será: <code>/a/{slug}</code>
                                </p>
                            )}
                        </div>

                        <button type="submit" className={styles.button}>
                            Próximo →
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.field}>
                            <label className={styles.label}>Seu Nome (Presidente) *</label>
                            <input
                                className={styles.input}
                                placeholder="Seu nome completo"
                                value={presidentName}
                                onChange={(e) => setPresidentName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>E-mail *</label>
                            <input
                                className={styles.input}
                                type="email"
                                placeholder="presidente@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
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

                        <div style={{ display: "flex", gap: "var(--space-3)" }}>
                            <button
                                type="button"
                                className={styles.button}
                                onClick={() => { setStep(1); setError(""); }}
                                style={{ background: "var(--gray-200)", color: "var(--gray-700)", flex: "0 0 auto", width: "auto", padding: "0 var(--space-6)" }}
                            >
                                ← Voltar
                            </button>
                            <button
                                type="submit"
                                className={styles.button}
                                disabled={loading}
                                style={{ flex: 1 }}
                            >
                                {loading ? <span className={styles.spinner} /> : "Criar Atlética"}
                            </button>
                        </div>
                    </form>
                )}

                <div className={styles.footer}>
                    <p>
                        Já tem uma conta?{" "}
                        <Link href="/login">Fazer login</Link>
                    </p>
                    <Link
                        href="/"
                        style={{
                            color: "var(--gray-400)",
                            fontSize: "0.8rem",
                            textDecoration: "none",
                            marginTop: 8,
                            display: "block",
                        }}
                    >
                        ← Voltar para o site
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
