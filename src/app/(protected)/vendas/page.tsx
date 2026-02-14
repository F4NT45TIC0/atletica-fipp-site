"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button, Badge, Card } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { PAYMENT_LABELS, STATUS_LABELS } from "@/lib/utils/constants";
import type { Sale, Tag, SaleStatus } from "@/lib/types";
import styles from "./vendas.module.css";

export default function VendasPage() {
    const { user } = useAuth();
    const supabase = createClient();
    const [sales, setSales] = useState<Sale[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterPayment, setFilterPayment] = useState<string>("all");
    const [filterTag, setFilterTag] = useState<string>("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!user) return;
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    async function fetchData() {
        const [salesResult, tagsResult] = await Promise.all([
            supabase
                .from("sales")
                .select(`
                    *,
                    seller:profiles!sales_seller_id_fkey(id, name),
                    items:sale_items(*, product:products(*)),
                    sale_tags(tag_id, tags(*))
                `)
                .order("created_at", { ascending: false }),
            supabase
                .from("tags")
                .select("*")
                .order("name"),
        ]);

        if (salesResult.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mapped = (salesResult.data as any[]).map((s) => ({
                ...s,
                tags: s.sale_tags?.map((st: { tags: Tag }) => st.tags).filter(Boolean) || [],
            }));
            setSales(mapped as unknown as Sale[]);
        }
        if (tagsResult.data) setTags(tagsResult.data as Tag[]);
        setLoading(false);
    }

    const filteredSales = sales.filter((sale) => {
        if (filterStatus !== "all" && sale.status !== filterStatus) return false;
        if (filterPayment !== "all" && sale.payment_method !== filterPayment) return false;
        if (filterTag !== "all") {
            const hasTg = sale.tags?.some((t) => t.id === filterTag);
            if (!hasTg) return false;
        }
        if (search) {
            const q = search.toLowerCase();
            const match =
                sale.buyer_name.toLowerCase().includes(q) ||
                sale.seller?.name?.toLowerCase().includes(q);
            if (!match) return false;
        }
        return true;
    });

    const getStatusVariant = (status: SaleStatus) => {
        if (status === "pendente") return "warning";
        if (status === "entregue") return "success";
        return "danger";
    };

    return (
        <div className={styles.page}>
            {/* Header row */}
            <div className={styles.pageHeader}>
                <div>
                    <p className={styles.pageSubtitle}>{filteredSales.length} vendas encontradas</p>
                </div>
                <Link href="/vendas/nova">
                    <Button>+ Nova Venda</Button>
                </Link>
            </div>

            {/* Filters */}
            <Card className={styles.filters}>
                <input
                    type="text"
                    placeholder="Buscar por comprador ou vendedor..."
                    className={styles.searchInput}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className={styles.filterRow}>
                    <select
                        className={styles.filterSelect}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Todos os status</option>
                        <option value="pendente">Pendente</option>
                        <option value="entregue">Entregue</option>
                        <option value="cancelado">Cancelado</option>
                    </select>

                    <select
                        className={styles.filterSelect}
                        value={filterPayment}
                        onChange={(e) => setFilterPayment(e.target.value)}
                    >
                        <option value="all">Todos pagamentos</option>
                        <option value="pix">PIX</option>
                        <option value="cartao">Cartão</option>
                        <option value="dinheiro">Dinheiro</option>
                    </select>

                    <select
                        className={styles.filterSelect}
                        value={filterTag}
                        onChange={(e) => setFilterTag(e.target.value)}
                    >
                        <option value="all">Todas as tags</option>
                        {tags.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Sales list */}
            {loading ? (
                <div className={styles.loadingList}>
                    {[1, 2, 3].map((i) => <div key={i} className={styles.skeleton} />)}
                </div>
            ) : filteredSales.length === 0 ? (
                <Card>
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>🛒</span>
                        <h3>Nenhuma venda encontrada</h3>
                        <p>Crie a primeira venda clicando no botão acima</p>
                    </div>
                </Card>
            ) : (
                <div className={styles.salesList}>
                    {filteredSales.map((sale) => (
                        <Link key={sale.id} href={`/vendas/${sale.id}`} className={styles.saleLink}>
                            <Card hover className={styles.saleCard}>
                                <div className={styles.saleTop}>
                                    <div className={styles.saleBuyer}>
                                        <span className={styles.buyerName}>{sale.buyer_name}</span>
                                        <Badge variant={getStatusVariant(sale.status)}>
                                            {STATUS_LABELS[sale.status]}
                                        </Badge>
                                    </div>
                                    <span className={styles.saleAmount}>{formatCurrency(Number(sale.total_amount))}</span>
                                </div>
                                <div className={styles.saleMeta}>
                                    <span>👤 {sale.seller?.name || "—"}</span>
                                    <span>💳 {PAYMENT_LABELS[sale.payment_method]}</span>
                                    <span>📅 {formatDateTime(sale.created_at)}</span>
                                </div>
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
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
