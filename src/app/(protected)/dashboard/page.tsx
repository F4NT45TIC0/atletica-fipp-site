"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card } from "@/components/ui";
import { formatCurrency } from "@/lib/utils/format";
import { PAYMENT_LABELS } from "@/lib/utils/constants";
import type { PaymentMethod } from "@/lib/types";
import styles from "./dashboard.module.css";

interface Metrics {
    totalSales: number;
    totalRevenue: number;
    pendingDeliveries: number;
    totalProducts: number;
}

interface PaymentStat {
    payment_method: PaymentMethod;
    count: number;
    total: number;
}

interface RecentSale {
    id: string;
    buyer_name: string;
    total_amount: number;
    payment_method: PaymentMethod;
    status: string;
    created_at: string;
    seller: { name: string } | null;
}

interface TopSeller {
    name: string;
    count: number;
    total: number;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const supabase = createClient();
    const [metrics, setMetrics] = useState<Metrics>({ totalSales: 0, totalRevenue: 0, pendingDeliveries: 0, totalProducts: 0 });
    const [paymentStats, setPaymentStats] = useState<PaymentStat[]>([]);
    const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
    const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    async function fetchDashboard() {
        try {
            // Run all 3 queries in parallel instead of sequentially
            const [salesResult, productsResult, recentResult] = await Promise.all([
                supabase
                    .from("sales")
                    .select("id, total_amount, status, payment_method, seller_id, seller:profiles!sales_seller_id_fkey(name)"),
                supabase
                    .from("products")
                    .select("id", { count: "exact", head: true })
                    .eq("active", true),
                supabase
                    .from("sales")
                    .select("id, buyer_name, total_amount, payment_method, status, created_at, seller:profiles!sales_seller_id_fkey(name)")
                    .order("created_at", { ascending: false })
                    .limit(5),
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rawSales = (salesResult.data || []) as any[];
            const activeSales = rawSales.filter((s) => s.status !== "cancelado");
            const totalSales = activeSales.length;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalRevenue = activeSales.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pendingDeliveries = activeSales.filter((s: any) => s.status === "pendente").length;

            setMetrics({
                totalSales,
                totalRevenue,
                pendingDeliveries,
                totalProducts: productsResult.count || 0,
            });

            // Payment stats (computed from the existing salesResult — no extra query)
            const paymentMap = new Map<PaymentMethod, { count: number; total: number }>();
            activeSales.forEach(s => {
                const method = s.payment_method as PaymentMethod;
                const existing = paymentMap.get(method) || { count: 0, total: 0 };
                paymentMap.set(method, {
                    count: existing.count + 1,
                    total: existing.total + Number(s.total_amount),
                });
            });
            setPaymentStats(
                Array.from(paymentMap.entries()).map(([method, stats]) => ({
                    payment_method: method,
                    ...stats,
                }))
            );

            setRecentSales((recentResult.data as unknown as RecentSale[]) || []);

            // Top sellers (computed from the existing salesResult — no extra query)
            const sellerMap = new Map<string, { name: string; count: number; total: number }>();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            activeSales.forEach((s: any) => {
                const sellerName = Array.isArray(s.seller) ? s.seller[0]?.name : s.seller?.name;
                const existing = sellerMap.get(s.seller_id) || { name: sellerName || "—", count: 0, total: 0 };
                sellerMap.set(s.seller_id, {
                    name: existing.name,
                    count: existing.count + 1,
                    total: existing.total + Number(s.total_amount),
                });
            });
            setTopSellers(
                Array.from(sellerMap.values())
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
            );
        } catch (err) {
            console.error("Error fetching dashboard:", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className={styles.loadingGrid}><div className={styles.pulse} /><div className={styles.pulse} /><div className={styles.pulse} /><div className={styles.pulse} /></div>;
    }

    return (
        <div className={styles.dashboard}>
            {/* Greeting */}
            <div className={styles.greeting}>
                <h2 className={styles.greetingTitle}>
                    Olá, {user?.name?.split(" ")[0]} 👋
                </h2>
                <p className={styles.greetingSubtitle}>
                    Aqui está o resumo do seu painel
                </p>
            </div>

            {/* Metric cards */}
            <div className={styles.metricsGrid}>
                <Card className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "var(--blue-100)", color: "var(--blue-600)" }}>🛒</div>
                    <div className={styles.metricInfo}>
                        <span className={styles.metricValue}>{metrics.totalSales}</span>
                        <span className={styles.metricLabel}>Total de Vendas</span>
                    </div>
                </Card>

                <Card className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "var(--success-light)", color: "#065F46" }}>💰</div>
                    <div className={styles.metricInfo}>
                        <span className={styles.metricValue}>{formatCurrency(metrics.totalRevenue)}</span>
                        <span className={styles.metricLabel}>Receita Total</span>
                    </div>
                </Card>

                <Card className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "var(--warning-light)", color: "#92400E" }}>🚚</div>
                    <div className={styles.metricInfo}>
                        <span className={styles.metricValue}>{metrics.pendingDeliveries}</span>
                        <span className={styles.metricLabel}>Entregas Pendentes</span>
                    </div>
                </Card>

                <Card className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "var(--info-light)", color: "#1E40AF" }}>📦</div>
                    <div className={styles.metricInfo}>
                        <span className={styles.metricValue}>{metrics.totalProducts}</span>
                        <span className={styles.metricLabel}>Produtos Ativos</span>
                    </div>
                </Card>
            </div>

            {/* Charts row */}
            <div className={styles.chartsRow}>
                {/* Payment methods */}
                <Card className={styles.chartCard}>
                    <h3 className={styles.cardTitle}>Vendas por Pagamento</h3>
                    <div className={styles.paymentStats}>
                        {paymentStats.length === 0 ? (
                            <p className={styles.emptyText}>Nenhuma venda registrada</p>
                        ) : (
                            paymentStats.map((ps) => {
                                const pct = metrics.totalSales > 0 ? (ps.count / metrics.totalSales) * 100 : 0;
                                return (
                                    <div key={ps.payment_method} className={styles.paymentRow}>
                                        <div className={styles.paymentInfo}>
                                            <span className={styles.paymentLabel}>{PAYMENT_LABELS[ps.payment_method]}</span>
                                            <span className={styles.paymentCount}>{ps.count} vendas</span>
                                        </div>
                                        <div className={styles.paymentBar}>
                                            <div
                                                className={styles.paymentBarFill}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className={styles.paymentTotal}>{formatCurrency(ps.total)}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>

                {/* Top sellers */}
                <Card className={styles.chartCard}>
                    <h3 className={styles.cardTitle}>Top Vendedores</h3>
                    <div className={styles.topSellers}>
                        {topSellers.length === 0 ? (
                            <p className={styles.emptyText}>Nenhum vendedor</p>
                        ) : (
                            topSellers.map((seller, i) => (
                                <div key={seller.name} className={styles.sellerRow}>
                                    <span className={styles.sellerRank}>#{i + 1}</span>
                                    <span className={styles.sellerName}>{seller.name}</span>
                                    <span className={styles.sellerCount}>{seller.count} vendas</span>
                                    <span className={styles.sellerTotal}>{formatCurrency(seller.total)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* Recent sales */}
            <Card className={styles.recentCard}>
                <h3 className={styles.cardTitle}>Vendas Recentes</h3>
                {recentSales.length === 0 ? (
                    <p className={styles.emptyText}>Nenhuma venda registrada ainda</p>
                ) : (
                    <div className={styles.recentList}>
                        {recentSales.map((sale) => (
                            <div key={sale.id} className={styles.recentItem}>
                                <div className={styles.recentInfo}>
                                    <span className={styles.recentBuyer}>{sale.buyer_name}</span>
                                    <span className={styles.recentMeta}>
                                        {sale.seller?.name} · {PAYMENT_LABELS[sale.payment_method]}
                                    </span>
                                </div>
                                <div className={styles.recentRight}>
                                    <span className={styles.recentAmount}>{formatCurrency(Number(sale.total_amount))}</span>
                                    <span className={`${styles.recentStatus} ${styles[`status-${sale.status}`]}`}>
                                        {sale.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
