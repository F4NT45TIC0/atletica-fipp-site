"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { Button, Card } from "@/components/ui";
import { SIZES } from "@/lib/utils/constants";
import styles from "../estoque.module.css";

export default function NovoProdutoPage() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();
    const supabase = createClient();

    const [name, setName] = useState("");
    const [type, setType] = useState("camiseta");
    const [size, setSize] = useState("M");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && user.role !== "presidente") {
            router.push("/estoque");
        }
    }, [user, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user?.org_id) {
            addToast("Erro: usuário sem organização associada", "error");
            return;
        }
        setLoading(true);

        const { error } = await supabase.from("products").insert({
            name,
            type,
            size,
            price: parseFloat(price),
            stock_qty: 0,
            description: description || null,
            active: true,
            org_id: user.org_id,
        });

        if (error) {
            addToast("Erro ao cadastrar produto", "error");
            console.error(error);
        } else {
            addToast("Produto cadastrado com sucesso!", "success");
            router.push("/estoque");
        }
        setLoading(false);
    }

    return (
        <div className={styles.page}>
            <Card padding="lg">
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formSection}>
                        <h3>Novo Produto</h3>
                        <p style={{ fontSize: "var(--text-sm)", color: "var(--gray-400)", marginTop: -8 }}>
                            Produtos são feitos sob demanda. O estoque será atualizado automaticamente ao registrar vendas.
                        </p>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>Nome *</label>
                            <input
                                className={styles.searchInput}
                                placeholder="Ex: Camiseta Atlética FIPP"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.field}>
                                <label className={styles.fieldLabel}>Tipo *</label>
                                <select
                                    className={styles.filterSelect}
                                    style={{ width: "100%", height: 40 }}
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="camiseta">Camiseta</option>
                                    <option value="caneca">Caneca</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.fieldLabel}>Tamanho *</label>
                                <select
                                    className={styles.filterSelect}
                                    style={{ width: "100%", height: 40 }}
                                    value={size}
                                    onChange={(e) => setSize(e.target.value)}
                                >
                                    {SIZES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>Preço (R$) *</label>
                            <input
                                className={styles.searchInput}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>Descrição</label>
                            <input
                                className={styles.searchInput}
                                placeholder="Descrição opcional"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <Button variant="secondary" type="button" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={loading} disabled={!name || !price}>
                            Cadastrar Produto
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
