"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import styles from "./configurar.module.css";

/* ==============================
   Collapsible Section Component
   ============================== */
interface SectionProps {
    icon: string;
    title: string;
    desc: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

function Section({ icon, title, desc, defaultOpen = false, children }: SectionProps) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader} onClick={() => setOpen(!open)}>
                <div className={styles.sectionHeaderLeft}>
                    <div className={styles.sectionIcon}>{icon}</div>
                    <div>
                        <div className={styles.sectionTitle}>{title}</div>
                        <div className={styles.sectionDesc}>{desc}</div>
                    </div>
                </div>
                <span className={`${styles.sectionChevron} ${open ? styles.sectionChevronOpen : ""}`}>▾</span>
            </div>
            {open && <div className={styles.sectionBody}>{children}</div>}
        </div>
    );
}

/* ==============================
   Color Picker Field
   ============================== */
function isValidFullHex(hex: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    // Keep a local text state so user can type freely
    const [textValue, setTextValue] = useState(value);

    // Sync from parent when value changes externally
    useEffect(() => {
        setTextValue(value);
    }, [value]);

    // The native color input only accepts valid 7-char hex
    const safeColorValue = isValidFullHex(value) ? value : "#000000";

    return (
        <div className={styles.colorField}>
            <span className={styles.colorFieldLabel}>{label}</span>
            <div className={styles.colorPickerWrap}>
                <input
                    type="color"
                    className={styles.colorSwatch}
                    value={safeColorValue}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setTextValue(e.target.value);
                    }}
                />
                <input
                    type="text"
                    className={styles.colorHexInput}
                    value={textValue}
                    onChange={(e) => {
                        let v = e.target.value;
                        if (!v.startsWith("#")) v = "#" + v;
                        // Allow partial typing
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                            setTextValue(v);
                            // Only push to parent when full valid hex
                            if (isValidFullHex(v)) onChange(v);
                        }
                    }}
                    maxLength={7}
                    placeholder="#000000"
                />
            </div>
        </div>
    );
}

/* ==============================
   Main Editor Page
   ============================== */
export default function ConfigurarPage() {
    const { user, organization, refreshOrganization } = useAuth();
    const { addToast } = useToast();
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: "",
        slug: "",
        hero_title: "",
        hero_heading: "",
        hero_subtitle: "",
        about_text: "",
        primary_color: "#00B4FF",
        secondary_color: "#0066FF",
        accent_color: "#00B4FF",
        bg_color: "#0a0e1a",
        whatsapp: "",
        instagram_url: "",
        twitter_url: "",
        youtube_url: "",
    });

    // Load org data
    useEffect(() => {
        if (!organization) return;
        setForm({
            name: organization.name || "",
            slug: organization.slug || "",
            hero_title: organization.hero_title || "",
            hero_heading: organization.hero_heading || "",
            hero_subtitle: organization.hero_subtitle || "",
            about_text: organization.about_text || "",
            primary_color: organization.primary_color || "#00B4FF",
            secondary_color: organization.secondary_color || "#0066FF",
            accent_color: organization.accent_color || "#00B4FF",
            bg_color: organization.bg_color || "#0a0e1a",
            whatsapp: organization.whatsapp || "",
            instagram_url: organization.instagram_url || "",
            twitter_url: organization.twitter_url || "",
            youtube_url: organization.youtube_url || "",
        });
        setLoading(false);
    }, [organization]);

    const updateField = useCallback(<K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setSaved(false);
    }, []);

    // Validate before save
    const validate = (): string | null => {
        if (!form.name.trim()) return "Nome da atlética é obrigatório";
        if (!form.slug.trim()) return "Slug (URL) é obrigatório";
        if (form.slug.trim().length < 2) return "Slug deve ter pelo menos 2 caracteres";
        if (!isValidFullHex(form.primary_color)) return "Cor primária inválida (use formato #RRGGBB)";
        if (!isValidFullHex(form.secondary_color)) return "Cor secundária inválida";
        if (!isValidFullHex(form.accent_color)) return "Cor de destaque inválida";
        if (!isValidFullHex(form.bg_color)) return "Cor de fundo inválida";
        // Validate URLs if provided
        const urlFields = ["instagram_url", "twitter_url", "youtube_url"] as const;
        for (const field of urlFields) {
            const val = form[field].trim();
            if (val && !val.startsWith("http://") && !val.startsWith("https://")) {
                return `URL de ${field.replace("_url", "")} deve começar com https://`;
            }
        }
        // Validate whatsapp (only digits)
        if (form.whatsapp.trim() && !/^\d{10,15}$/.test(form.whatsapp.trim())) {
            return "WhatsApp deve conter apenas números (10-15 dígitos)";
        }
        return null;
    };

    // Save to database
    const handleSave = async () => {
        if (!organization) return;

        const validationError = validate();
        if (validationError) {
            addToast(validationError, "error");
            return;
        }

        setSaving(true);
        try {
            const cleanSlug = form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

            // Check slug uniqueness if changed
            if (cleanSlug !== organization.slug) {
                const { data: existing } = await supabase
                    .from("organizations")
                    .select("id")
                    .eq("slug", cleanSlug)
                    .neq("id", organization.id)
                    .maybeSingle();

                if (existing) {
                    addToast("Esse slug já está em uso por outra atlética", "error");
                    setSaving(false);
                    return;
                }
            }

            const { error } = await supabase
                .from("organizations")
                .update({
                    name: form.name.trim(),
                    slug: cleanSlug,
                    hero_title: form.hero_title.trim() || null,
                    hero_heading: form.hero_heading.trim() || null,
                    hero_subtitle: form.hero_subtitle.trim() || null,
                    about_text: form.about_text.trim() || null,
                    primary_color: form.primary_color,
                    secondary_color: form.secondary_color,
                    accent_color: form.accent_color,
                    bg_color: form.bg_color,
                    whatsapp: form.whatsapp.trim() || null,
                    instagram_url: form.instagram_url.trim() || null,
                    twitter_url: form.twitter_url.trim() || null,
                    youtube_url: form.youtube_url.trim() || null,
                })
                .eq("id", organization.id);

            if (error) throw error;

            // Refresh the organization in AuthProvider so the whole app has fresh data
            await refreshOrganization();

            setSaved(true);
            addToast("Configurações salvas com sucesso!", "success");
            setTimeout(() => setSaved(false), 4000);
        } catch (err: unknown) {
            console.error("Save error:", err);
            const msg = err instanceof Error ? err.message : "Erro desconhecido";
            addToast(`Erro ao salvar: ${msg}`, "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !organization) {
        return (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                Carregando configurações...
            </div>
        );
    }

    if (user?.role !== "presidente") {
        return (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                Apenas o presidente pode editar a landing page.
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Actions bar */}
            <div className={styles.actions}>
                <div className={styles.actionsLeft}>
                    <div className={styles.linkPreview}>
                        🌐 /a/<span className={styles.linkPreviewSlug}>{form.slug || "..."}</span>
                    </div>
                    {saved && (
                        <div className={styles.savedBadge}>✓ Salvo</div>
                    )}
                </div>
                <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
            </div>

            {/* --- Identidade --- */}
            <Section icon="🎭" title="Identidade" desc="Nome e slug da sua atlética" defaultOpen>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Nome da Atlética</label>
                    <input
                        className={styles.fieldInput}
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="Atlética FIPP"
                    />
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Slug (URL)</label>
                    <div className={styles.slugWrap}>
                        <span className={styles.slugPrefix}>/a/</span>
                        <input
                            className={styles.slugInput}
                            value={form.slug}
                            onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                            placeholder="fipp"
                        />
                    </div>
                    <span className={styles.fieldHint}>Apenas letras minúsculas, números e hífen</span>
                </div>
            </Section>

            {/* --- Cores --- */}
            <Section icon="🎨" title="Cores" desc="Defina as cores do tema da sua landing page">
                <div className={styles.colorGrid}>
                    <ColorPicker label="Primária" value={form.primary_color} onChange={(v) => updateField("primary_color", v)} />
                    <ColorPicker label="Secundária" value={form.secondary_color} onChange={(v) => updateField("secondary_color", v)} />
                    <ColorPicker label="Destaque" value={form.accent_color} onChange={(v) => updateField("accent_color", v)} />
                    <ColorPicker label="Fundo" value={form.bg_color} onChange={(v) => updateField("bg_color", v)} />
                </div>

                {/* Mini Preview */}
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Preview</label>
                    <div
                        className={styles.previewMini}
                        style={{ background: isValidFullHex(form.bg_color) ? form.bg_color : "#0a0e1a", color: "#fff" }}
                    >
                        <span className={styles.previewTag} style={{ color: isValidFullHex(form.accent_color) ? form.accent_color : "#00B4FF" }}>
                            {form.hero_title || form.name || "SUA ATLÉTICA"}
                        </span>
                        <h3 className={styles.previewTitle}>
                            <span style={{ color: "#fff" }}>{form.hero_heading || "VISTA A"} </span>
                            <span style={{ color: isValidFullHex(form.primary_color) ? form.primary_color : "#00B4FF" }}>{form.name.split(" ")[0].toUpperCase() || "ATLÉTICA"}</span>
                        </h3>
                        <p className={styles.previewSubtitle}>
                            {form.hero_subtitle || "Subtitulo da sua landing page aparece aqui..."}
                        </p>
                        <span
                            className={styles.previewBtn}
                            style={{ background: `linear-gradient(135deg, ${isValidFullHex(form.primary_color) ? form.primary_color : "#00B4FF"}, ${isValidFullHex(form.secondary_color) ? form.secondary_color : "#0066FF"})` }}
                        >
                            VER PRODUTOS
                        </span>
                    </div>
                </div>
            </Section>

            {/* --- Textos --- */}
            <Section icon="✏️" title="Textos" desc="Títulos e descrições da landing">
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Título do Hero</label>
                    <input
                        className={styles.fieldInput}
                        value={form.hero_title}
                        onChange={(e) => updateField("hero_title", e.target.value)}
                        placeholder="ATLÉTICA FIPP"
                    />
                    <span className={styles.fieldHint}>O título pequeno que aparece acima do heading (ex: &quot;Atlética FIPP — Coleção 2025&quot;)</span>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Heading Principal</label>
                    <input
                        className={styles.fieldInput}
                        value={form.hero_heading}
                        onChange={(e) => updateField("hero_heading", e.target.value)}
                        placeholder="VISTA A"
                    />
                    <span className={styles.fieldHint}>O texto grande do hero. O nome da atlética aparece ao lado automaticamente (ex: &quot;VISTA A&quot; + &quot;FIPP&quot;)</span>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Subtítulo</label>
                    <input
                        className={styles.fieldInput}
                        value={form.hero_subtitle}
                        onChange={(e) => updateField("hero_subtitle", e.target.value)}
                        placeholder="Os melhores produtos da sua atlética"
                    />
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Texto Sobre</label>
                    <textarea
                        className={styles.fieldTextarea}
                        value={form.about_text}
                        onChange={(e) => updateField("about_text", e.target.value)}
                        placeholder="Conte a história da sua atlética..."
                        rows={4}
                    />
                </div>
            </Section>

            {/* --- Redes Sociais --- */}
            <Section icon="📱" title="Contato & Redes Sociais" desc="WhatsApp, Instagram, Twitter e YouTube">
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>WhatsApp</label>
                    <input
                        className={styles.fieldInput}
                        value={form.whatsapp}
                        onChange={(e) => updateField("whatsapp", e.target.value.replace(/\D/g, ""))}
                        placeholder="5518999999999"
                    />
                    <span className={styles.fieldHint}>Número com DDD e código do país (apenas números)</span>
                </div>

                <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Instagram</label>
                        <input
                            className={styles.fieldInput}
                            value={form.instagram_url}
                            onChange={(e) => updateField("instagram_url", e.target.value)}
                            placeholder="https://instagram.com/atleticafipp"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Twitter / X</label>
                        <input
                            className={styles.fieldInput}
                            value={form.twitter_url}
                            onChange={(e) => updateField("twitter_url", e.target.value)}
                            placeholder="https://x.com/atleticafipp"
                        />
                    </div>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>YouTube</label>
                    <input
                        className={styles.fieldInput}
                        value={form.youtube_url}
                        onChange={(e) => updateField("youtube_url", e.target.value)}
                        placeholder="https://youtube.com/@atleticafipp"
                    />
                </div>
            </Section>

            {/* Bottom save */}
            <div className={styles.actions}>
                <div className={styles.actionsLeft}>
                    <a
                        href={`/a/${organization.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.logoUploadBtn}
                    >
                        🔗 Ver Landing Page
                    </a>
                    {saved && (
                        <div className={styles.savedBadge}>✓ Salvo</div>
                    )}
                </div>
                <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
            </div>
        </div>
    );
}