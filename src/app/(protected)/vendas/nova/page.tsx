"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { Button, Card } from "@/components/ui";
import { formatCurrency } from "@/lib/utils/format";
import type { Product, Tag } from "@/lib/types";
import styles from "../vendas.module.css";

interface CartItem {
    product: Product;
    quantity: number;
}

export default function NovaVendaPage() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();
    const supabase = createClient();

    const [buyerName, setBuyerName] = useState("");
    const [buyerContact, setBuyerContact] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("pix");
    const [notes, setNotes] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showProducts, setShowProducts] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchProduct, setSearchProduct] = useState("");

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchData() {
        const [productsResult, tagsResult] = await Promise.all([
            supabase
                .from("products")
                .select("*")
                .eq("active", true)
                .order("name"),
            supabase
                .from("tags")
                .select("*")
                .order("name"),
        ]);
        if (productsResult.data) setProducts(productsResult.data as Product[]);
        if (tagsResult.data) setTags(tagsResult.data as Tag[]);
    }

    function addToCart(product: Product) {
        const existing = cart.find((c) => c.product.id === product.id);
        if (existing) {
            setCart(
                cart.map((c) =>
                    c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
                )
            );
        } else {
            setCart([...cart, { product, quantity: 1 }]);
        }
        setShowProducts(false);
        setSearchProduct("");
    }

    function updateQuantity(productId: string, delta: number) {
        setCart(
            cart
                .map((c) => {
                    if (c.product.id !== productId) return c;
                    const newQty = c.quantity + delta;
                    if (newQty <= 0) return null;
                    return { ...c, quantity: newQty };
                })
                .filter(Boolean) as CartItem[]
        );
    }

    function removeFromCart(productId: string) {
        setCart(cart.filter((c) => c.product.id !== productId));
    }

    function toggleTag(tagId: string) {
        setSelectedTags((prev) =>
            prev.includes(tagId)
                ? prev.filter((t) => t !== tagId)
                : [...prev, tagId]
        );
    }

    const total = cart.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    const availableProducts = products.filter(
        (p) =>
            !cart.find((c) => c.product.id === p.id) &&
            (searchProduct === "" ||
                p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
                p.size.toLowerCase().includes(searchProduct.toLowerCase()))
    );

    function handleContactChange(e: React.ChangeEvent<HTMLInputElement>) {
        let val = e.target.value;
        // Check if user is typing a phone number (starts with digit or '(')
        const isPhone = /^[\d(]/.test(val);

        if (isPhone) {
            // Strip non-digits
            let digits = val.replace(/\D/g, "");
            if (digits.length > 11) digits = digits.slice(0, 11);

            // Apply mask
            if (digits.length > 10) {
                // (11) 99999-9999
                val = digits.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
            } else if (digits.length > 6) {
                // (11) 9999-9999
                val = digits.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
            } else if (digits.length > 2) {
                // (11) 9999...
                val = digits.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
            } else {
                val = digits;
            }
        }
        setBuyerContact(val);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user || cart.length === 0) return;

        // Validation based on type
        const cleanContact = buyerContact.replace(/\D/g, "");
        const isPhone = /^[\d(]/.test(buyerContact);

        if (buyerContact) {
            if (isPhone) {
                if (cleanContact.length < 10) {
                    addToast("Telefone inválido (mínimo 10 dígitos com DDD)", "error");
                    return;
                }
            } else {
                // Email validation
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerContact)) {
                    addToast("E-mail inválido", "error");
                    return;
                }
            }
        }

        setLoading(true);

        try {
            // Prepared data for RPC
            const itemsJson = cart.map((c) => ({
                product_id: c.product.id,
                quantity: c.quantity,
                unit_price: c.product.price,
            }));

            // Call RPC function to atomic create sale + items + update stock
            const { error } = await supabase.rpc("register_sale", {
                p_buyer_name: buyerName,
                p_buyer_contact: buyerContact || null,
                p_payment_method: paymentMethod,
                p_notes: notes || null,
                p_seller_id: user.id,
                p_total_amount: total,
                p_items: itemsJson,
                p_tags: selectedTags,
            });

            if (error) throw error;

            addToast("Venda registrada com sucesso!", "success");
            router.push("/vendas");
        } catch (err) {
            console.error(err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            addToast(`Erro: ${(err as any).message || "Falha ao registrar venda"}`, "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.page}>
            <form className={styles.saleForm} onSubmit={handleSubmit}>
                {/* Buyer info */}
                <Card padding="lg">
                    <div className={styles.formSection}>
                        <h3>Dados do Comprador</h3>
                        <div className={styles.formRow}>
                            <div className={styles.field}>
                                <label className={styles.fieldLabel}>Nome do Comprador *</label>
                                <input
                                    className={styles.searchInput}
                                    placeholder="Nome completo"
                                    value={buyerName}
                                    onChange={(e) => setBuyerName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.fieldLabel}>Contato</label>
                                <input
                                    className={styles.searchInput}
                                    placeholder="Telefone ou e-mail"
                                    value={buyerContact}
                                    onChange={handleContactChange}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Products */}
                <Card padding="lg">
                    <div className={styles.formSection}>
                        <h3>Produtos</h3>
                        {cart.map((item) => (
                            <div key={item.product.id} className={styles.productItem}>
                                <div className={styles.productItemInfo}>
                                    <span className={styles.productItemName}>
                                        {item.product.name} — {item.product.size}
                                    </span>
                                    <span className={styles.productItemMeta}>
                                        {formatCurrency(item.product.price)} × {item.quantity} ={" "}
                                        {formatCurrency(item.product.price * item.quantity)}
                                    </span>
                                </div>
                                <div className={styles.qtyControl}>
                                    <button
                                        type="button"
                                        className={styles.qtyBtn}
                                        onClick={() => updateQuantity(item.product.id, -1)}
                                    >
                                        −
                                    </button>
                                    <span className={styles.qtyValue}>{item.quantity}</span>
                                    <button
                                        type="button"
                                        className={styles.qtyBtn}
                                        onClick={() => updateQuantity(item.product.id, 1)}
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className={styles.removeBtn}
                                    onClick={() => removeFromCart(item.product.id)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {showProducts ? (
                            <div>
                                <input
                                    className={styles.searchInput}
                                    placeholder="Buscar produto..."
                                    value={searchProduct}
                                    onChange={(e) => setSearchProduct(e.target.value)}
                                    autoFocus
                                />
                                <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 8 }}>
                                    {availableProducts.map((p) => (
                                        <div
                                            key={p.id}
                                            className={styles.productItem}
                                            style={{ cursor: "pointer" }}
                                            onClick={() => addToCart(p)}
                                        >
                                            <div className={styles.productItemInfo}>
                                                <span className={styles.productItemName}>
                                                    {p.name} — {p.size}
                                                </span>
                                                <span className={styles.productItemMeta}>
                                                    {formatCurrency(p.price)} · Vendidos: {p.stock_qty}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {availableProducts.length === 0 && (
                                        <p style={{ padding: 12, color: "var(--gray-400)", fontSize: "var(--text-sm)" }}>
                                            Nenhum produto disponível
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className={styles.addProductBtn}
                                onClick={() => setShowProducts(true)}
                            >
                                + Adicionar Produto
                            </button>
                        )}
                    </div>
                </Card>

                {/* Payment & Tags */}
                <Card padding="lg">
                    <div className={styles.formSection}>
                        <h3>Pagamento e Tags</h3>
                        <div className={styles.formRow}>
                            <div className={styles.field}>
                                <label className={styles.fieldLabel}>Método de Pagamento *</label>
                                <select
                                    className={styles.filterSelect}
                                    style={{ width: "100%", height: 40 }}
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <option value="pix">PIX</option>
                                    <option value="cartao">Cartão</option>
                                    <option value="dinheiro">Dinheiro</option>
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.fieldLabel}>Observações</label>
                                <input
                                    className={styles.searchInput}
                                    placeholder="Observações opcionais"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        {tags.length > 0 && (
                            <div className={styles.field}>
                                <label className={styles.fieldLabel}>Tags</label>
                                <div className={styles.tagsSelect}>
                                    {tags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            className={`${styles.tagOption} ${selectedTags.includes(tag.id) ? styles.tagOptionActive : ""}`}
                                            onClick={() => toggleTag(tag.id)}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Total and submit */}
                <div className={styles.totalPreview}>
                    <span>Total da Venda</span>
                    <span>{formatCurrency(total)}</span>
                </div>

                <div className={styles.formActions}>
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={() => router.back()}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        loading={loading}
                        disabled={!buyerName || cart.length === 0}
                    >
                        Registrar Venda
                    </Button>
                </div>
            </form>
        </div>
    );
}
