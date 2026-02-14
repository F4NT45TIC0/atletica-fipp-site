export type UserRole = "presidente" | "membro";
export type PaymentMethod = "pix" | "cartao" | "dinheiro";
export type SaleStatus = "pendente" | "entregue" | "cancelado";
export type NotificationType = "erro" | "info" | "cancelamento";
export type ProductType = "camiseta" | "caneca" | "outro";
export type SubscriptionPlan = "trial" | "basic" | "pro";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled" | "expired";

export interface Organization {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    bg_color: string;
    instagram_url: string | null;
    twitter_url: string | null;
    youtube_url: string | null;
    whatsapp: string | null;
    hero_title: string;
    hero_heading: string | null;
    hero_subtitle: string | null;
    about_text: string | null;
    gallery_photos: string[];
    plan: SubscriptionPlan;
    subscription_status: SubscriptionStatus;
    trial_ends_at: string | null;
    subscription_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    active: boolean;
    created_by: string | null;
    org_id: string | null;
    created_at: string;
}

export interface Product {
    id: string;
    name: string;
    type: ProductType;
    size: string;
    price: number;
    stock_qty: number;
    description: string | null;
    active: boolean;
    org_id: string | null;
    created_at: string;
}

export interface Sale {
    id: string;
    buyer_name: string;
    buyer_contact: string | null;
    payment_method: PaymentMethod;
    status: SaleStatus;
    notes: string | null;
    seller_id: string;
    total_amount: number;
    org_id: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    seller?: User;
    items?: SaleItem[];
    tags?: Tag[];
    delivery?: Delivery;
}

export interface SaleItem {
    id: string;
    sale_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    // Joined
    product?: Product;
}

export interface Delivery {
    id: string;
    sale_id: string;
    delivered_by: string;
    received_by: string;
    notes: string | null;
    confirmed_at: string;
    // Joined
    delivered_by_user?: User;
}

export interface Notification {
    id: string;
    from_user: string;
    to_user: string;
    sale_id: string | null;
    message: string;
    type: NotificationType;
    read: boolean;
    org_id: string | null;
    created_at: string;
    // Joined
    from_user_data?: User;
    sale?: Sale;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
    org_id: string | null;
}

export interface SaleTag {
    sale_id: string;
    tag_id: string;
}

export interface Invite {
    id: string;
    org_id: string;
    code: string;
    role: UserRole;
    email: string | null;
    created_by: string;
    used_by: string | null;
    used_at: string | null;
    expires_at: string | null;
    created_at: string;
}

// Dashboard metrics
export interface DashboardMetrics {
    totalSales: number;
    totalRevenue: number;
    pendingDeliveries: number;
    totalProducts: number;
    salesByPayment: { method: PaymentMethod; count: number; total: number }[];
    recentSales: Sale[];
    topSellers: { user: User; count: number; total: number }[];
}
