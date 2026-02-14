import type { PaymentMethod, SaleStatus, NotificationType, ProductType } from "@/lib/types";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
    pix: "PIX",
    cartao: "Cartão",
    dinheiro: "Dinheiro",
};

export const STATUS_LABELS: Record<SaleStatus, string> = {
    pendente: "Pendente",
    entregue: "Entregue",
    cancelado: "Cancelado",
};

export const STATUS_COLORS: Record<SaleStatus, string> = {
    pendente: "var(--warning)",
    entregue: "var(--success)",
    cancelado: "var(--danger)",
};

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
    erro: "Erro",
    info: "Informação",
    cancelamento: "Cancelamento",
};

export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
    erro: "var(--danger)",
    info: "var(--info)",
    cancelamento: "var(--warning)",
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
    camiseta: "Camiseta",
    caneca: "Caneca",
    outro: "Outro",
};

export const SIZES = ["PP", "P", "M", "G", "GG", "XG", "Único"] as const;
