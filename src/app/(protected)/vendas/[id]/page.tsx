"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { Button, Badge, Card } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { PAYMENT_LABELS, STATUS_LABELS } from "@/lib/utils/constants";
import type { Sale, SaleStatus } from "@/lib/types";
import styles from "../vendas.module.css";

export default function SaleDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();
    const supabase = createClient();

    const [sale, setSale] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [showErrorForm, setShowErrorForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isPresidente = user?.role === "presidente";

    useEffect(() => {
        if (!id) return;
        fetchSale();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function fetchSale() {
        const { data } = await supabase
            .from("sales")
            .select(`
        *,
        seller:profiles!sales_seller_id_fkey(*),
        items:sale_items(*, product:products(*)),
        sale_tags(tag_id, tags(*)),
        delivery:deliveries(*, delivered_by_user:profiles!deliveries_delivered_by_fkey(*))
      `)
            .eq("id", id)
            .single();

        if (data) {
            const mapped = {
                ...data,
                tags: data.sale_tags?.map((st: { tags: unknown }) => st.tags).filter(Boolean) || [],
                delivery: Array.isArray(data.delivery) ? data.delivery[0] : data.delivery,
            };
            setSale(mapped as unknown as Sale);
        }
        setLoading(false);
    }

    async function handleCancel() {
        if (!confirm("Tem certeza que deseja cancelar esta venda?")) return;

        // Optimistic UI: update status immediately
        const previousSale = sale;
        setSale(prev => prev ? { ...prev, status: "cancelado" as SaleStatus } : prev);

        // Call RPC to atomic cancel + decrement stock
        const { error } = await supabase.rpc("cancel_sale", { p_sale_id: id });

        if (error) {
            addToast("Erro ao cancelar venda", "error");
            // Revert on failure
            setSale(previousSale);
        } else {
            addToast("Venda cancelada. Estoque atualizado.", "success");
        }
    }

    async function handleReportError() {
        if (!errorMessage.trim() || !user || !sale) return;
        setSubmitting(true);

        // Find presidente(s) in the same org
        const { data: presidentes } = await supabase
            .from("profiles")
            .select("id")
            .eq("role", "presidente")
            .eq("org_id", user.org_id);

        if (!presidentes || presidentes.length === 0) {
            addToast("Nenhum presidente encontrado", "error");
            setSubmitting(false);
            return;
        }

        const notifications = presidentes.map((p: { id: string }) => ({
            from_user: user.id,
            to_user: p.id,
            sale_id: sale.id,
            message: errorMessage,
            type: "erro",
            org_id: user.org_id,
        }));

        const { error } = await supabase
            .from("notifications")
            .insert(notifications);

        if (error) {
            addToast("Erro ao enviar notificação", "error");
        } else {
            addToast("Erro reportado ao presidente!", "success");
            setShowErrorForm(false);
            setErrorMessage("");
        }
        setSubmitting(false);
    }

    const getStatusVariant = (status: SaleStatus) => {
        if (status === "pendente") return "warning";
        if (status === "entregue") return "success";
        return "danger";
    };

    if (loading) {
        return <div className={styles.skeleton} style={{ height: 400 }} />;
    }

    if (!sale) {
        return (
            <Card>
                <div className={styles.empty}>
                    <h3>Venda não encontrada</h3>
                </div>
            </Card>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.detailGrid}>
                {/* Main content */}
                <div className={styles.detailMain}>
                    <Card padding="lg">
                        <div className={styles.formSection}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3>Informações da Venda</h3>
                                <Badge variant={getStatusVariant(sale.status)}>
                                    {STATUS_LABELS[sale.status]}
                                </Badge>
                            </div>

                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Comprador</span>
                                    <span className={styles.infoValue}>{sale.buyer_name}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Contato</span>
                                    <span className={styles.infoValue}>{sale.buyer_contact || "—"}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Vendedor</span>
                                    <span className={styles.infoValue}>{sale.seller?.name || "—"}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Pagamento</span>
                                    <span className={styles.infoValue}>{PAYMENT_LABELS[sale.payment_method]}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Data</span>
                                    <span className={styles.infoValue}>{formatDateTime(sale.created_at)}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Total</span>
                                    <span className={styles.infoValue} style={{ color: "var(--blue-600)", fontWeight: 700 }}>
                                        {formatCurrency(Number(sale.total_amount))}
                                    </span>
                                </div>
                            </div>

                            {sale.notes && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Observações</span>
                                    <span className={styles.infoValue}>{sale.notes}</span>
                                </div>
                            )}

                            {sale.tags && sale.tags.length > 0 && (
                                <div className={styles.saleTags}>
                                    {sale.tags.map((tag) => (
                                        <span
                                            key={tag.id}
                                            className={styles.saleTag}
                                            style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}40` }}
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Items table */}
                    <Card padding="lg">
                        <div className={styles.formSection}>
                            <h3>Itens</h3>
                            <table className={styles.itemsTable}>
                                <thead>
                                    <tr>
                                        <th>Produto</th>
                                        <th>Tamanho</th>
                                        <th>Qtd</th>
                                        <th>Preço Un.</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.items?.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.product?.name || "—"}</td>
                                            <td>{item.product?.size || "—"}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(Number(item.unit_price))}</td>
                                            <td>{formatCurrency(Number(item.unit_price) * item.quantity)}</td>
                                        </tr>
                                    ))}
                                    <tr className={styles.totalRow}>
                                        <td colSpan={4} style={{ textAlign: "right" }}>Total</td>
                                        <td>{formatCurrency(Number(sale.total_amount))}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Delivery info */}
                    {sale.delivery && (
                        <Card padding="lg">
                            <div className={styles.formSection}>
                                <h3>Entrega</h3>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Entregue por</span>
                                        <span className={styles.infoValue}>{sale.delivery.delivered_by_user?.name || "—"}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Recebido por</span>
                                        <span className={styles.infoValue}>{sale.delivery.received_by}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Data da Entrega</span>
                                        <span className={styles.infoValue}>{formatDateTime(sale.delivery.confirmed_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className={styles.detailSidebar}>
                    {sale.status !== "cancelado" && (
                        <Card padding="lg">
                            <div className={styles.actions}>
                                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: 8 }}>Ações</h4>

                                {/* Report error (any user) */}
                                {!showErrorForm ? (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        fullWidth
                                        onClick={() => setShowErrorForm(true)}
                                    >
                                        ⚠️ Reportar Erro
                                    </Button>
                                ) : (
                                    <div className={styles.errorForm}>
                                        <textarea
                                            className={styles.errorTextarea}
                                            placeholder="Descreva o erro..."
                                            value={errorMessage}
                                            onChange={(e) => setErrorMessage(e.target.value)}
                                        />
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowErrorForm(false)}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                size="sm"
                                                loading={submitting}
                                                onClick={handleReportError}
                                                disabled={!errorMessage.trim()}
                                            >
                                                Enviar
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Presidente actions */}
                                {isPresidente && sale.status === "pendente" && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        fullWidth
                                        onClick={handleCancel}
                                        loading={submitting}
                                    >
                                        ✕ Cancelar Venda
                                    </Button>
                                )}
                            </div>
                        </Card>
                    )}

                    <Button
                        variant="ghost"
                        fullWidth
                        onClick={() => router.push("/vendas")}
                    >
                        ← Voltar
                    </Button>
                </div>
            </div>
        </div>
    );
}
