"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { Button, Badge, Card, Modal } from "@/components/ui";
import { formatDateTime } from "@/lib/utils/format";
import type { User, Invite } from "@/lib/types";
import styles from "./membros.module.css";

function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export default function MembrosPage() {
    const { user, organization } = useAuth();
    const router = useRouter();
    const { addToast } = useToast();
    const supabase = createClient();

    const [members, setMembers] = useState<User[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [creating, setCreating] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"membro" | "presidente">("membro");
    const [creatingInvite, setCreatingInvite] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"members" | "invites">("members");

    const fetchMembers = useCallback(async () => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });
        if (data) setMembers(data as User[]);
        setLoading(false);
    }, [supabase]);

    const fetchInvites = useCallback(async () => {
        const { data } = await supabase
            .from("invites")
            .select("*")
            .order("created_at", { ascending: false });
        if (data) setInvites(data as Invite[]);
    }, [supabase]);

    useEffect(() => {
        if (user && user.role !== "presidente") {
            router.push("/dashboard");
            return;
        }
        fetchMembers();
        fetchInvites();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    async function handleCreateMember(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);

        try {
            const res = await fetch("/api/auth/create-member", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    email: newEmail,
                    password: newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erro ao criar membro");
            }

            addToast("Membro criado com sucesso!", "success");
            setShowModal(false);
            setNewName("");
            setNewEmail("");
            setNewPassword("");
            fetchMembers();
        } catch (err) {
            addToast(err instanceof Error ? err.message : "Erro ao criar membro", "error");
        }
        setCreating(false);
    }

    async function handleCreateInvite(e: React.FormEvent) {
        e.preventDefault();
        setCreatingInvite(true);

        try {
            const code = generateCode();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

            const { error: insertError } = await supabase
                .from("invites")
                .insert({
                    code,
                    role: inviteRole,
                    email: inviteEmail.trim() || null,
                    org_id: organization?.id,
                    created_by: user?.id,
                    expires_at: expiresAt.toISOString(),
                });

            if (insertError) {
                throw new Error(insertError.message);
            }

            addToast("Convite criado com sucesso!", "success");
            setShowInviteModal(false);
            setInviteEmail("");
            setInviteRole("membro");
            fetchInvites();
        } catch (err) {
            addToast(err instanceof Error ? err.message : "Erro ao criar convite", "error");
        }
        setCreatingInvite(false);
    }

    async function handleDeleteInvite(inviteId: string) {
        if (!confirm("Excluir este convite?")) return;
        const { error: deleteError } = await supabase
            .from("invites")
            .delete()
            .eq("id", inviteId);
        if (deleteError) {
            addToast("Erro ao excluir convite", "error");
        } else {
            addToast("Convite excluído", "success");
            fetchInvites();
        }
    }

    function copyInviteLink(code: string) {
        const url = `${window.location.origin}/invite/${code}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedCode(code);
            addToast("Link copiado!", "success");
            setTimeout(() => setCopiedCode(null), 2000);
        });
    }

    async function handleTransferPresidency(memberId: string, memberName: string) {
        if (!user) return;
        if (!confirm(`Transferir presidência para ${memberName}? Você se tornará membro.`)) return;

        try {
            await supabase
                .from("profiles")
                .update({ role: "membro" })
                .eq("id", user.id);

            await supabase
                .from("profiles")
                .update({ role: "presidente" })
                .eq("id", memberId);

            addToast("Presidência transferida! Você será redirecionado.", "success");
            setTimeout(() => window.location.href = "/dashboard", 1500);
        } catch (err) {
            console.error(err);
            addToast("Erro ao transferir presidência", "error");
        }
    }

    const pendingInvites = invites.filter((inv) => !inv.used_by);
    const usedInvites = invites.filter((inv) => inv.used_by);

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <p className={styles.pageSubtitle}>
                        {members.length} membros · {pendingInvites.length} convites pendentes
                    </p>
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <Button variant="secondary" onClick={() => setShowInviteModal(true)}>
                        🔗 Gerar Convite
                    </Button>
                    <Button onClick={() => setShowModal(true)}>+ Novo Membro</Button>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === "members" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("members")}
                >
                    👥 Membros ({members.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "invites" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("invites")}
                >
                    🔗 Convites ({invites.length})
                </button>
            </div>

            {activeTab === "members" && (
                <>
                    {loading ? (
                        <div className={styles.membersList}>
                            {[1, 2, 3].map((i) => <div key={i} className={styles.skeleton} />)}
                        </div>
                    ) : (
                        <div className={styles.membersList}>
                            {members.map((member) => (
                                <Card key={member.id} className={styles.memberCard}>
                                    <div className={styles.memberInfo}>
                                        <div className={styles.avatar}>
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className={styles.memberName}>{member.name}</span>
                                            <span className={styles.memberEmail}>{member.email}</span>
                                        </div>
                                    </div>
                                    <div className={styles.memberRight}>
                                        <Badge variant={member.role === "presidente" ? "info" : "default"}>
                                            {member.role === "presidente" ? "Presidente" : "Membro"}
                                        </Badge>
                                        <span className={styles.memberDate}>
                                            {formatDateTime(member.created_at)}
                                        </span>
                                        {member.role === "membro" && member.id !== user?.id && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleTransferPresidency(member.id, member.name)}
                                            >
                                                👑 Transferir
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            ))}
                            {members.length === 0 && !loading && (
                                <p style={{ textAlign: "center", color: "var(--gray-400)", padding: "var(--space-8)" }}>
                                    Nenhum membro encontrado.
                                </p>
                            )}
                        </div>
                    )}
                </>
            )}

            {activeTab === "invites" && (
                <div className={styles.membersList}>
                    {pendingInvites.length > 0 && (
                        <>
                            <p className={styles.sectionLabel}>Pendentes</p>
                            {pendingInvites.map((inv) => {
                                const isExpired = inv.expires_at && new Date(inv.expires_at) < new Date();
                                return (
                                    <Card key={inv.id} className={styles.inviteCard}>
                                        <div className={styles.inviteInfo}>
                                            <div className={styles.inviteCode}>
                                                <code>{inv.code}</code>
                                                <Badge variant={isExpired ? "default" : "warning"}>
                                                    {isExpired ? "Expirado" : "Pendente"}
                                                </Badge>
                                            </div>
                                            <div className={styles.inviteMeta}>
                                                {inv.email && <span>📧 {inv.email}</span>}
                                                <span>Cargo: {inv.role === "presidente" ? "Presidente" : "Membro"}</span>
                                                {inv.expires_at && (
                                                    <span>
                                                        Expira: {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.inviteActions}>
                                            {!isExpired && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => copyInviteLink(inv.code)}
                                                >
                                                    {copiedCode === inv.code ? "✓ Copiado!" : "📋 Copiar Link"}
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteInvite(inv.id)}
                                                style={{ color: "var(--danger)" }}
                                            >
                                                🗑
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </>
                    )}

                    {usedInvites.length > 0 && (
                        <>
                            <p className={styles.sectionLabel} style={{ marginTop: "var(--space-4)" }}>
                                Utilizados
                            </p>
                            {usedInvites.map((inv) => (
                                <div key={inv.id} style={{ opacity: 0.6 }}>
                                <Card className={styles.inviteCard}>
                                    <div className={styles.inviteInfo}>
                                        <div className={styles.inviteCode}>
                                            <code>{inv.code}</code>
                                            <Badge variant="success">Usado</Badge>
                                        </div>
                                        <div className={styles.inviteMeta}>
                                            {inv.email && <span>📧 {inv.email}</span>}
                                            {inv.used_at && (
                                                <span>Usado em: {new Date(inv.used_at).toLocaleDateString("pt-BR")}</span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                                </div>
                            ))}
                        </>
                    )}

                    {invites.length === 0 && (
                        <p style={{ textAlign: "center", color: "var(--gray-400)", padding: "var(--space-8)" }}>
                            Nenhum convite criado. Clique em &quot;Gerar Convite&quot; para convidar membros.
                        </p>
                    )}
                </div>
            )}

            {/* Create member modal */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title="Novo Membro"
            >
                <form className={styles.form} onSubmit={handleCreateMember}>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>Nome *</label>
                        <input
                            className={styles.formInput}
                            placeholder="Nome completo"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>E-mail *</label>
                        <input
                            className={styles.formInput}
                            type="email"
                            placeholder="membro@email.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>Senha *</label>
                        <input
                            className={styles.formInput}
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={creating} disabled={!newName || !newEmail || !newPassword}>
                            Criar Membro
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Generate invite modal */}
            <Modal
                open={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                title="Gerar Convite"
            >
                <form className={styles.form} onSubmit={handleCreateInvite}>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--gray-500)", marginBottom: "var(--space-2)" }}>
                        Gere um link de convite para alguém entrar na sua atlética. O convite expira em 7 dias.
                    </p>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>E-mail (opcional)</label>
                        <input
                            className={styles.formInput}
                            type="email"
                            placeholder="Restringir a um e-mail específico"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)" }}>
                            Se preenchido, apenas esse e-mail poderá usar o convite.
                        </span>
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>Cargo</label>
                        <select
                            className={styles.formInput}
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as "membro" | "presidente")}
                        >
                            <option value="membro">Membro</option>
                            <option value="presidente">Presidente</option>
                        </select>
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="secondary" type="button" onClick={() => setShowInviteModal(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={creatingInvite}>
                            Gerar Convite
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
