"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { Button, Badge, Card } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import styles from "./entregas.module.css";

interface DeliverySale {
    id: string;
    buyer_name: string;
    buyer_contact: string | null;
    total_amount: number;
    created_at: string;
    status: string;
    seller: { name: string } | null;
    items: { quantity: number; product: { name: string; size: string } | null }[];
}

export default function EntregasPage() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const supabase = createClient();

    const [pendentes, setPendentes] = useState<DeliverySale[]>([]);
    const [entregues, setEntregues] = useState<DeliverySale[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"pendentes" | "entregues">("pendentes");
    const [delivering, setDelivering] = useState<string | null>(null);
    const [receivedBy, setReceivedBy] = useState("");

    useEffect(() => {
        if (!user) return;
        fetchDeliveries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    async function fetchDeliveries() {
        // Run both queries in parallel instead of sequentially
        const [pendingResult, deliveredResult] = await Promise.all([
            supabase
                .from("sales")
                .select("id, buyer_name, buyer_contact, total_amount, created_at, status, seller:profiles!sales_seller_id_fkey(name), items:sale_items(quantity, product:products(name, size))")
                .eq("status", "pendente")
                .order("created_at", { ascending: true }),
            supabase
                .from("sales")
                .select("id, buyer_name, buyer_contact, total_amount, created_at, status, seller:profiles!sales_seller_id_fkey(name), items:sale_items(quantity, product:products(name, size))")
                .eq("status", "entregue")
                .order("created_at", { ascending: false })
                .limit(50),
        ]);

        setPendentes((pendingResult.data as unknown as DeliverySale[]) || []);
        setEntregues((deliveredResult.data as unknown as DeliverySale[]) || []);
        setLoading(false);
    }

    async function handleConfirmDelivery(saleId: string) {
        if (!receivedBy.trim() || !user) return;

        // Optimistic UI: move the sale from pendentes to entregues immediately
        const deliveredSale = pendentes.find(s => s.id === saleId);
        if (deliveredSale) {
            const updated = { ...deliveredSale, status: "entregue" };
            setPendentes(prev => prev.filter(s => s.id !== saleId));
            setEntregues(prev => [updated, ...prev]);
        }
        setDelivering(null);
        setReceivedBy("");

        try {
            // Call RPC function to bypass RLS and perform atomic update
            const { error } = await supabase.rpc("confirm_delivery", {
                p_sale_id: saleId,
                p_delivered_by: user.id,
                p_received_by: receivedBy,
            });

            if (error) throw error;

            addToast("Entrega confirmada com sucesso!", "success");
        } catch (err) {
            console.error("Erro na entrega:", err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            addToast(`Erro: ${(err as any).message || "Falha ao confirmar"}`, "error");
            // Revert optimistic update on failure
            fetchDeliveries();
        }
    }

    const list = tab === "pendentes" ? pendentes : entregues;

    return (
        <div className={styles.page}>
            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${tab === "pendentes" ? styles.tabActive : ""}`}
                    onClick={() => setTab("pendentes")}
                >
                    🚚 Pendentes
                    {pendentes.length > 0 && (
                        <span className={styles.tabBadge}>{pendentes.length}</span>
                    )}
                </button>
                <button
                    className={`${styles.tab} ${tab === "entregues" ? styles.tabActive : ""}`}
                    onClick={() => setTab("entregues")}
                >
                    ✅ Entregues
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className={styles.loadingList}>
                    {[1, 2, 3].map((i) => <div key={i} className={styles.skeleton} />)}
                </div>
            ) : list.length === 0 ? (
                <Card>
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>
                            {tab === "pendentes" ? "🚚" : "✅"}
                        </span>
                        <h3>
                            {tab === "pendentes"
                                ? "Nenhuma entrega pendente"
                                : "Nenhuma entrega realizada"}
                        </h3>
                    </div>
                </Card>
            ) : (
                <div className={styles.deliveryList}>
                    {list.map((sale) => (
                        <Card key={sale.id} className={styles.deliveryCard}>
                            <div className={styles.deliveryTop}>
                                <div>
                                    <span className={styles.buyerName}>{sale.buyer_name}</span>
                                    <Badge variant={sale.status === "pendente" ? "warning" : "success"}>
                                        {sale.status === "pendente" ? "Pendente" : "Entregue"}
                                    </Badge>
                                </div>
                                <span className={styles.amount}>{formatCurrency(Number(sale.total_amount))}</span>
                            </div>

                            {/* Items */}
                            <div className={styles.itemsList}>
                                {sale.items?.map((item, i) => (
                                    <span key={i} className={styles.itemChip}>
                                        {item.product?.name} ({item.product?.size}) × {item.quantity}
                                    </span>
                                ))}
                            </div>

                            <div className={styles.deliveryMeta}>
                                <span>Vendido por {sale.seller?.name || "—"}</span>
                                <span>{formatDateTime(sale.created_at)}</span>
                            </div>

                            {/* Confirm delivery */}
                            {tab === "pendentes" && (
                                <div className={styles.deliveryAction}>
                                    {delivering === sale.id ? (
                                        <div className={styles.confirmForm}>
                                            <input
                                                className={styles.confirmInput}
                                                placeholder="Nome de quem recebeu"
                                                value={receivedBy}
                                                onChange={(e) => setReceivedBy(e.target.value)}
                                                autoFocus
                                            />
                                            <div className={styles.confirmButtons}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setDelivering(null);
                                                        setReceivedBy("");
                                                    }}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleConfirmDelivery(sale.id)}
                                                    disabled={!receivedBy.trim()}
                                                >
                                                    ✓ Confirmar
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            fullWidth
                                            onClick={() => setDelivering(sale.id)}
                                        >
                                            🚚 Confirmar Entrega
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
