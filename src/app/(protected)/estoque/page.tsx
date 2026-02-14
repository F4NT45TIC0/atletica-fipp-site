"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button, Badge, Card } from "@/components/ui";
import { formatCurrency } from "@/lib/utils/format";
import { PRODUCT_TYPE_LABELS } from "@/lib/utils/constants";
import type { Product } from "@/lib/types";
import styles from "./estoque.module.css";

export default function EstoquePage() {
    const { user } = useAuth();
    const supabase = createClient();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState("all");
    const [filterSize, setFilterSize] = useState("all");
    const [search, setSearch] = useState("");

    const isPresidente = user?.role === "presidente";

    useEffect(() => {
        if (!user) return;
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    async function fetchProducts() {
        const { data } = await supabase
            .from("products")
            .select("*")
            .order("name");
        if (data) setProducts(data as Product[]);
        setLoading(false);
    }

    const filtered = products.filter((p) => {
        if (filterType !== "all" && p.type !== filterType) return false;
        if (filterSize !== "all" && p.size !== filterSize) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!p.name.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const sizes = [...new Set(products.map((p) => p.size))].sort();

    const getStockVariant = (qty: number) => {
        if (qty === 0) return "default" as const;
        if (qty >= 10) return "success" as const;
        return "info" as const;
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <p className={styles.pageSubtitle}>{filtered.length} produtos</p>
                {isPresidente && (
                    <Link href="/estoque/novo">
                        <Button>+ Novo Produto</Button>
                    </Link>
                )}
            </div>

            {/* Filters */}
            <Card className={styles.filters}>
                <input
                    type="text"
                    placeholder="Buscar produto..."
                    className={styles.searchInput}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className={styles.filterRow}>
                    <select
                        className={styles.filterSelect}
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">Todos os tipos</option>
                        <option value="camiseta">Camiseta</option>
                        <option value="caneca">Caneca</option>
                        <option value="outro">Outro</option>
                    </select>
                    <select
                        className={styles.filterSelect}
                        value={filterSize}
                        onChange={(e) => setFilterSize(e.target.value)}
                    >
                        <option value="all">Todos os tamanhos</option>
                        {sizes.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Products grid */}
            {loading ? (
                <div className={styles.grid}>
                    {[1, 2, 3, 4].map((i) => <div key={i} className={styles.skeleton} />)}
                </div>
            ) : filtered.length === 0 ? (
                <Card>
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>📦</span>
                        <h3>Nenhum produto encontrado</h3>
                        <p>{isPresidente ? "Adicione seu primeiro produto" : "Nenhum produto cadastrado"}</p>
                    </div>
                </Card>
            ) : (
                <div className={styles.grid}>
                    {filtered.map((product) => (
                        <Card key={product.id} className={styles.productCard}>
                            <div className={styles.productHeader}>
                                <span className={styles.productType}>
                                    {PRODUCT_TYPE_LABELS[product.type]}
                                </span>
                                <Badge variant={getStockVariant(product.stock_qty)}>
                                    {product.stock_qty} pendentes
                                </Badge>
                            </div>
                            <h3 className={styles.productName}>{product.name}</h3>
                            <div className={styles.productMeta}>
                                <span className={styles.productSize}>Tam: {product.size}</span>
                                <span className={styles.productPrice}>{formatCurrency(product.price)}</span>
                            </div>
                            {product.description && (
                                <p className={styles.productDesc}>{product.description}</p>
                            )}
                            {!product.active && (
                                <Badge variant="danger">Inativo</Badge>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
