"use client";
/* eslint-disable react-hooks/rules-of-hooks */

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./orgLanding.module.css";
import type { Organization } from "@/lib/types";

/* ─── Types ─── */
interface OrgProduct {
    id: string;
    name: string;
    type: string;
    size: string;
    price: number;
    description: string | null;
}

interface GalleryItem {
    id: number;
    url: string;
    title: string;
}

interface Props {
    org: Organization;
    products: OrgProduct[];
}

/* ─── SVG Icons ─── */
const IconInstagram = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);

const IconTwitter = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const IconYoutube = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
    </svg>
);

const IconWhatsApp = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const IconArrowRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
);

const IconProduct = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
);

/* ─── Canvas Particle Background ─── */
function ParticleCanvas({ hue }: { hue: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let w = (canvas.width = window.innerWidth);
        let h = (canvas.height = window.innerHeight);

        interface Particle {
            x: number; y: number; vx: number; vy: number;
            baseVx: number; baseVy: number;
            size: number; alpha: number; hue: number;
        }

        const particles: Particle[] = [];
        const count = Math.min(100, Math.floor((w * h) / 14000));

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.02 + Math.random() * 0.03;
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: 0,
                vy: 0,
                baseVx: Math.cos(angle) * speed,
                baseVy: Math.sin(angle) * speed,
                size: Math.random() * 2.5 + 1,
                alpha: Math.random() * 0.5 + 0.2,
                hue: hue + Math.random() * 25 - 12,
            });
        }

        function draw() {
            ctx!.clearRect(0, 0, w, h);
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            for (const p of particles) {
                const dx = p.x - mx;
                const dy = p.y - my;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150 && dist > 0) {
                    const force = (150 - dist) / 150;
                    p.vx += (dx / dist) * force * 0.08;
                    p.vy += (dy / dist) * force * 0.08;
                }

                p.vx *= 0.96;
                p.vy *= 0.96;
                p.x += p.baseVx + p.vx;
                p.y += p.baseVy + p.vy;

                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;

                ctx!.beginPath();
                ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx!.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`;
                ctx!.fill();
            }

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx2 = particles[i].x - particles[j].x;
                    const dy2 = particles[i].y - particles[j].y;
                    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                    if (dist2 < 130) {
                        const a = (1 - dist2 / 130) * 0.18;
                        ctx!.beginPath();
                        ctx!.moveTo(particles[i].x, particles[i].y);
                        ctx!.lineTo(particles[j].x, particles[j].y);
                        ctx!.strokeStyle = `hsla(${hue}, 100%, 70%, ${a})`;
                        ctx!.lineWidth = 0.6;
                        ctx!.stroke();
                    }
                }
            }

            animId = requestAnimationFrame(draw);
        }

        draw();

        const onResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        const onMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };

        window.addEventListener("resize", onResize);
        window.addEventListener("mousemove", onMouseMove);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("mousemove", onMouseMove);
        };
    }, [hue]);

    return <canvas ref={canvasRef} className={styles.canvasBg} />;
}

/* ─── Custom Cursor ─── */
function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const posRef = useRef({ dotX: -100, dotY: -100, ringX: -100, ringY: -100 });
    const hoverRef = useRef(false);
    const frameRef = useRef<number>(0);
    const [isMobile, setIsMobile] = useState(true);

    useEffect(() => {
        setIsMobile(window.matchMedia("(max-width: 768px)").matches || "ontouchstart" in window);
    }, []);

    useEffect(() => {
        if (isMobile) return;
        const onMouseMove = (e: MouseEvent) => {
            posRef.current.dotX = e.clientX;
            posRef.current.dotY = e.clientY;
        };
        function animate() {
            const { dotX, dotY } = posRef.current;
            posRef.current.ringX += (dotX - posRef.current.ringX) * 0.15;
            posRef.current.ringY += (dotY - posRef.current.ringY) * 0.15;
            if (dotRef.current) {
                dotRef.current.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;
                dotRef.current.style.width = hoverRef.current ? "20px" : "8px";
                dotRef.current.style.height = hoverRef.current ? "20px" : "8px";
                dotRef.current.style.marginLeft = hoverRef.current ? "-6px" : "0px";
                dotRef.current.style.marginTop = hoverRef.current ? "-6px" : "0px";
            }
            if (ringRef.current) {
                const size = hoverRef.current ? 60 : 40;
                ringRef.current.style.transform = `translate(${posRef.current.ringX - size / 2}px, ${posRef.current.ringY - size / 2}px)`;
                ringRef.current.style.width = `${size}px`;
                ringRef.current.style.height = `${size}px`;
            }
            frameRef.current = requestAnimationFrame(animate);
        }
        frameRef.current = requestAnimationFrame(animate);
        window.addEventListener("mousemove", onMouseMove);
        const onOver = (e: Event) => { if ((e.target as HTMLElement).closest("a, button, [data-hover]")) hoverRef.current = true; };
        const onOut = (e: Event) => { if ((e.target as HTMLElement).closest("a, button, [data-hover]")) hoverRef.current = false; };
        document.addEventListener("mouseover", onOver);
        document.addEventListener("mouseout", onOut);
        return () => {
            cancelAnimationFrame(frameRef.current);
            window.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseover", onOver);
            document.removeEventListener("mouseout", onOut);
        };
    }, [isMobile]);

    if (isMobile) return null;
    return (
        <>
            <div ref={dotRef} className={styles.cursorDot} />
            <div ref={ringRef} className={styles.cursorRing} />
        </>
    );
}

/* ─── Scroll Reveal Hook ─── */
function useReveal(direction: "up" | "left" | "right" | "scale" = "up") {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold: 0.12 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    const cls = direction === "up" ? styles.revealUp : direction === "left" ? styles.revealLeft : direction === "right" ? styles.revealRight : styles.revealScale;
    return { ref, className: `${cls} ${visible ? styles.visible : ""}` };
}

/* ─── Staggered Reveal ─── */
function useStaggerReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold: 0.1 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return {
        ref,
        getChildStyle: (i: number) => ({
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(40px)",
            transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`,
        }),
    };
}

/* ─── GlowText ─── */
function GlowText({ children, className, accentColor }: { children: React.ReactNode; className?: string; accentColor: string }) {
    const wrapRef = useRef<HTMLSpanElement>(null);
    const mousePos = useRef({ x: -1000, y: -1000 });
    const animRef = useRef<number>(0);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const onMouseMove = (e: MouseEvent) => { mousePos.current.x = e.clientX; mousePos.current.y = e.clientY; };
        function tick() {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const mx = mousePos.current.x, my = mousePos.current.y;
            const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
            const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
            const relX = ((mx - rect.left) / rect.width) * 100;
            const relY = ((my - rect.top) / rect.height) * 100;
            const t = Math.max(0, 1 - dist / 450);
            const blueAlpha = (t * 0.55).toFixed(3);
            const whiteBase = (0.10 + t * 0.08).toFixed(3);
            const spotSize = (120 + (1 - t) * 200).toFixed(0);
            const r = parseInt(accentColor.slice(1, 3), 16) || 0;
            const g = parseInt(accentColor.slice(3, 5), 16) || 56;
            const b = parseInt(accentColor.slice(5, 7), 16) || 189;
            el.style.backgroundImage = `radial-gradient(${spotSize}px circle at ${relX}% ${relY}%, rgba(${r},${g},${b},${blueAlpha}), transparent 70%), linear-gradient(90deg, rgba(255,255,255,${whiteBase}), rgba(255,255,255,${whiteBase}))`;
            animRef.current = requestAnimationFrame(tick);
        }
        animRef.current = requestAnimationFrame(tick);
        window.addEventListener("mousemove", onMouseMove);
        return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("mousemove", onMouseMove); };
    }, [accentColor]);

    return <span ref={wrapRef} className={className}>{children}</span>;
}

/* ─── ProductModal ─── */
function ProductModal({ product, onClose, org }: { product: OrgProduct | null; onClose: () => void; org: Organization }) {
    useEffect(() => {
        if (!product) return;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
    }, [product, onClose]);

    const fmt = (p: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p);

    return (
        <div className={`${styles.modalOverlay} ${product ? styles.modalOverlayOpen : ""}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            {product && (
                <div className={styles.modalCard}>
                    <button className={styles.modalClose} onClick={onClose} aria-label="Fechar">✕</button>
                    <span className={styles.modalType}>{product.type} — {product.size}</span>
                    <h3 className={styles.modalName}>{product.name}</h3>
                    <div className={styles.modalDivider} />
                    {product.description && <p className={styles.modalDesc}>{product.description}</p>}
                    <div className={styles.modalDetail}><span className={styles.modalDetailLabel}>Tamanho</span><span className={styles.modalDetailValue}>{product.size}</span></div>
                    <div className={styles.modalDetail}><span className={styles.modalDetailLabel}>Disponibilidade</span><span className={styles.modalDetailValue}>Em estoque</span></div>
                    <span className={styles.modalPrice}>{fmt(product.price)}</span>
                    {org.whatsapp ? (
                        <a href={`https://wa.me/${org.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Tenho interesse no produto: ${product.name}`)}`} target="_blank" rel="noopener noreferrer" className={styles.modalWhatsapp}>
                            <IconWhatsApp className={styles.modalWhatsappIcon} /> Comprar via WhatsApp
                        </a>
                    ) : (
                        <Link href="/login" className={styles.modalCta}>Entrar para Comprar</Link>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── GalleryModal ─── */
const PHOTO_SPANS = [
    { col: 1, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 },
    { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 1, row: 1 },
    { col: 2, row: 1 }, { col: 1, row: 1 }, { col: 1, row: 2 },
];

function shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
}

function GalleryModal({ photos, onClose }: { photos: GalleryItem[] | null; onClose: () => void }) {
    const [photoLayouts, setPhotoLayouts] = useState<{ col: number; row: number }[]>([]);
    useEffect(() => {
        if (!photos) return;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        const shuffled = shuffleArray(PHOTO_SPANS);
        setPhotoLayouts(photos.map((_, i) => shuffled[i % shuffled.length]));
        return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
    }, [photos, onClose]);

    return (
        <div className={`${styles.modalOverlay} ${photos ? styles.modalOverlayOpen : ""}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            {photos && (
                <div className={styles.galleryModalCard}>
                    <button className={styles.modalClose} onClick={onClose} aria-label="Fechar">✕</button>
                    <div className={styles.galleryModalHeader}>
                        <span className={styles.modalType}>Galeria</span>
                        <h3 className={styles.modalName}>Nossos Momentos</h3>
                        <p className={styles.galleryModalCount}>{photos.length} fotos</p>
                        <div className={styles.modalDivider} />
                    </div>
                    <div className={styles.galleryModalGrid}>
                        {photos.map((photo, i) => {
                            const layout = photoLayouts[i] || { col: 1, row: 1 };
                            return (
                                <div key={photo.id} className={styles.galleryModalPhotoWrap} style={{ gridColumn: `span ${layout.col}`, gridRow: `span ${layout.row}` }}>
                                    <Image src={photo.url} alt={photo.title || `Foto ${i + 1}`} fill sizes="(max-width: 768px) 100vw, 400px" className={styles.galleryModalPhoto} />
                                </div>
                            );
                        })}
                    </div>
                    <p className={styles.galleryModalHint}>Mais fotos em breve — fique ligado nas nossas redes!</p>
                </div>
            )}
        </div>
    );
}

/* ─── Helpers ─── */
function hexToHue(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
        const d = max - min;
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
    }
    return Math.round(h * 360);
}

function getInitials(name: string): string {
    return name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export default function OrgLandingClient({ org, products }: Props) {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<OrgProduct | null>(null);
    const [selectedGalleryPhotos, setSelectedGalleryPhotos] = useState<GalleryItem[] | null>(null);

    const productsHeader = useReveal("up");
    const productsGrid = useStaggerReveal();
    const aboutLeft = useReveal("left");
    const aboutRight = useReveal("right");
    const ctaReveal = useReveal("scale");
    const galleryHeader = useReveal("up");

    /* Gallery carousel */
    const galleryPhotos: GalleryItem[] = (org.gallery_photos || []).map((url: string, i: number) => ({ id: i, url, title: `Foto ${i + 1}` }));
    const hasGallery = galleryPhotos.length > 0;
    const [galleryIndex, setGalleryIndex] = useState(0);
    const galleryLen = Math.max(galleryPhotos.length, 1);
    const [isSliding, setIsSliding] = useState(false);
    const extendedGallery = hasGallery ? [...galleryPhotos, ...galleryPhotos, ...galleryPhotos] : [];
    const realOffset = galleryLen;

    const galleryGoTo = useCallback((dir: 1 | -1) => {
        if (isSliding || !hasGallery) return;
        setIsSliding(true);
        setGalleryIndex((prev) => prev + dir);
    }, [isSliding, hasGallery]);

    const handleTransitionEnd = useCallback(() => {
        setIsSliding(false);
        setGalleryIndex((prev) => ((prev % galleryLen) + galleryLen) % galleryLen);
    }, [galleryLen]);

    useEffect(() => {
        if (!hasGallery) return;
        const timer = setInterval(() => galleryGoTo(1), 5000);
        return () => clearInterval(timer);
    }, [galleryGoTo, hasGallery]);

    /* Theme */
    const primaryColor = org.primary_color || "#0ea5e9";
    const secondaryColor = org.secondary_color || "#0284c7";
    const accentColor = org.accent_color || "#38bdf8";
    const bgColor = org.bg_color || "#0a0e1a";
    const hue = hexToHue(accentColor);
    const initials = getInitials(org.name);
    const hasSocials = org.instagram_url || org.twitter_url || org.youtube_url || org.whatsapp;
    const fmt = (p: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (!selectedProduct) document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen, selectedProduct]);

    const closeMenu = useCallback(() => setMenuOpen(false), []);
    const closeModal = useCallback(() => setSelectedProduct(null), []);
    const closeGalleryModal = useCallback(() => setSelectedGalleryPhotos(null), []);

    const cssVars = {
        "--primary": primaryColor,
        "--secondary": secondaryColor,
        "--accent": accentColor,
        "--bg": bgColor,
    } as React.CSSProperties;

    return (
        <div className={styles.landing} style={cssVars}>
            <ParticleCanvas hue={hue} />
            <CustomCursor />
            <ProductModal product={selectedProduct} onClose={closeModal} org={org} />
            <GalleryModal photos={selectedGalleryPhotos} onClose={closeGalleryModal} />

            {/* ─── Navbar ─── */}
            <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ""}`}>
                <div className={styles.navLogo}>
                    <span className={styles.navLogoMark}>
                        {org.logo_url ? <img src={org.logo_url} alt={org.name} className={styles.navLogoMarkImg} /> : initials}
                    </span>
                    {org.name}
                </div>
                <div className={styles.navDesktopLinks}>
                    {products.length > 0 && <a href="#produtos" className={styles.navLink}>Produtos</a>}
                    {org.about_text && <a href="#sobre" className={styles.navLink}>Sobre</a>}
                    {hasGallery && <a href="#momentos" className={styles.navLink}>Momentos</a>}
                    <Link href="/login" className={styles.navCta}>Área do Membro</Link>
                </div>
                <button className={`${styles.menuToggle} ${menuOpen ? styles.menuToggleOpen : ""}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
                    <span className={styles.menuToggleLine} /><span className={styles.menuToggleLine} /><span className={styles.menuToggleLine} />
                </button>
            </nav>

            {/* ─── Sidebar ─── */}
            <div className={`${styles.sidebarOverlay} ${menuOpen ? styles.sidebarOverlayOpen : ""}`} onClick={closeMenu} />
            <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
                {products.length > 0 && <a href="#produtos" className={styles.sidebarLink} onClick={closeMenu}>Produtos</a>}
                {org.about_text && <a href="#sobre" className={styles.sidebarLink} onClick={closeMenu}>Sobre</a>}
                {hasGallery && <a href="#momentos" className={styles.sidebarLink} onClick={closeMenu}>Momentos</a>}
                <Link href="/login" className={styles.sidebarLink} onClick={closeMenu}>Login</Link>
                {hasSocials && (
                    <div className={styles.sidebarSocials}>
                        {org.instagram_url && <a href={org.instagram_url} target="_blank" rel="noopener noreferrer" className={styles.sidebarSocialLink} aria-label="Instagram"><IconInstagram className={styles.sidebarSocialIcon} /></a>}
                        {org.twitter_url && <a href={org.twitter_url} target="_blank" rel="noopener noreferrer" className={styles.sidebarSocialLink} aria-label="Twitter"><IconTwitter className={styles.sidebarSocialIcon} /></a>}
                        {org.youtube_url && <a href={org.youtube_url} target="_blank" rel="noopener noreferrer" className={styles.sidebarSocialLink} aria-label="YouTube"><IconYoutube className={styles.sidebarSocialIcon} /></a>}
                        {org.whatsapp && <a href={`https://wa.me/${org.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className={styles.sidebarSocialLink} aria-label="WhatsApp"><IconWhatsApp className={styles.sidebarSocialIcon} /></a>}
                    </div>
                )}
            </aside>

            {/* ─── Hero ─── */}
            <section className={styles.hero}>
                <div className={styles.heroGlow} />
                <div className={styles.heroOrb} />
                <div className={styles.heroContent}>
                    {org.logo_url && <img src={org.logo_url} alt={org.name} className={styles.heroLogo} />}
                    <span className={styles.heroTag}>
                        <span className={styles.heroTagDot} />
                        {org.hero_title || `${org.name} — Coleção 2025`}
                    </span>
                    <h1 className={styles.heroTitle}>
                        {org.hero_heading || "VISTA A"}{" "}
                        <GlowText className={styles.heroTitleAccent} accentColor={accentColor}>
                            {org.name.split(" ")[0].toUpperCase()}
                        </GlowText>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        {org.hero_subtitle || "Produtos exclusivos para quem vive o espírito universitário. Qualidade, estilo e orgulho em cada peça."}
                    </p>
                    <div className={styles.heroCtas}>
                        {products.length > 0 && <a href="#produtos" className={styles.btnPrimary}>Ver Produtos <IconArrowRight /></a>}
                        {org.about_text && <a href="#sobre" className={styles.btnOutline}>Conheça a {org.name.split(" ")[0]}</a>}
                    </div>
                </div>
                <div className={styles.heroScrollIndicator}>
                    <div className={styles.heroScrollLine} />
                    <span className={styles.heroScrollText}>Scroll</span>
                </div>
            </section>

            {/* ─── Products ─── */}
            {products.length > 0 && (
                <section id="produtos" className={`${styles.products} ${styles.section}`}>
                    <div className={styles.productsInner}>
                        <div ref={productsHeader.ref} className={productsHeader.className}>
                            <div className={styles.sectionHeader}>
                                <p className={styles.sectionTag}><span className={styles.sectionTagLine} />Coleção</p>
                                <h2 className={styles.sectionTitle}>NOSSOS <span className={styles.sectionTitleAccent}>PRODUTOS</span></h2>
                            </div>
                        </div>
                        <div ref={productsGrid.ref} className={styles.productsGrid}>
                            {products.map((product, i) => (
                                <div key={product.id} className={styles.productCardNoImage} style={productsGrid.getChildStyle(i)} data-hover onClick={() => setSelectedProduct(product)}>
                                    <div className={styles.productCardIconWrap}>
                                        <div className={styles.productCardIcon}><IconProduct /></div>
                                    </div>
                                    <div className={styles.productInfo}>
                                        <p className={styles.productType}>{product.type}</p>
                                        <h3 className={styles.productName}>{product.name}</h3>
                                        <div className={styles.productMeta}>
                                            <span className={styles.productSize}>Tam: {product.size}</span>
                                            <span className={styles.productPrice}>{fmt(product.price)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ─── About ─── */}
            {org.about_text && (
                <section id="sobre" className={`${styles.about} ${styles.section}`}>
                    <div className={styles.aboutInner}>
                        <div ref={aboutLeft.ref} className={aboutLeft.className}>
                            <div className={styles.sectionHeader}>
                                <p className={styles.sectionTag}><span className={styles.sectionTagLine} />Quem Somos</p>
                                <h2 className={styles.sectionTitle}>A <span className={styles.sectionTitleAccent}>{org.name.split(" ")[0].toUpperCase()}</span></h2>
                            </div>
                            <p className={styles.aboutText}>{org.about_text}</p>
                        </div>
                        <div ref={aboutRight.ref} className={aboutRight.className}>
                            <div className={styles.aboutVisual}>
                                <div className={styles.aboutVisualGlow} />
                                <div className={styles.aboutVisualOrb} />
                                <span className={styles.aboutVisualBig}>{org.name.split(" ")[0]}</span>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ─── Gallery ─── */}
            {hasGallery && (
                <section id="momentos" className={`${styles.gallery} ${styles.section}`}>
                    <div ref={galleryHeader.ref} className={`${styles.galleryHeader} ${galleryHeader.className}`}>
                        <p className={styles.sectionTag}><span className={styles.sectionTagLine} />Galeria</p>
                        <h2 className={styles.sectionTitle}>NOSSOS <span className={styles.sectionTitleAccent}>MOMENTOS</span></h2>
                    </div>
                    <div className={styles.carouselWrapper}>
                        <button className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`} onClick={() => galleryGoTo(-1)} aria-label="Anterior" data-hover>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <div className={styles.carouselViewport}>
                            <div
                                className={styles.galleryTrack}
                                style={{
                                    transform: `translateX(calc(-${galleryIndex + realOffset} * var(--carousel-step)))`,
                                    transition: isSliding ? "transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)" : "none",
                                }}
                                onTransitionEnd={handleTransitionEnd}
                            >
                                {extendedGallery.map((item, i) => {
                                    const realI = i - realOffset;
                                    const dist = Math.abs(realI - galleryIndex);
                                    const isActive = dist === 0;
                                    const isAdj = dist === 1;
                                    return (
                                        <div
                                            key={`${item.id}-${i}`}
                                            className={`${styles.galleryItem} ${isActive ? styles.galleryItemActive : ""}`}
                                            data-hover
                                            onClick={() => setSelectedGalleryPhotos(galleryPhotos)}
                                            style={{
                                                transform: `scale(${isActive ? 1 : isAdj ? 0.88 : 0.78})`,
                                                opacity: isActive ? 1 : isAdj ? 0.6 : 0.25,
                                                filter: `brightness(${isActive ? 1 : isAdj ? 0.55 : 0.35})`,
                                            }}
                                        >
                                            <Image src={item.url} alt={item.title} fill sizes="340px" className={styles.galleryItemImage} />
                                            <div className={styles.galleryItemOverlay}>
                                                <div className={styles.galleryItemOverlayIcon}>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                                        <circle cx="9" cy="9" r="2" />
                                                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                                    </svg>
                                                </div>
                                                <span className={styles.galleryItemOverlayText}>Ver Galeria de Fotos</span>
                                            </div>
                                            <div className={`${styles.galleryItemLabel} ${isActive ? styles.galleryItemLabelActive : ""}`}>
                                                <h3 className={styles.galleryItemTitle}>{item.title}</h3>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <button className={`${styles.carouselArrow} ${styles.carouselArrowRight}`} onClick={() => galleryGoTo(1)} aria-label="Próximo" data-hover>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                    </div>
                    <div className={styles.carouselDots}>
                        {galleryPhotos.map((_, i) => (
                            <button
                                key={i}
                                className={`${styles.carouselDot} ${((galleryIndex % galleryLen) + galleryLen) % galleryLen === i ? styles.carouselDotActive : ""}`}
                                onClick={() => { if (!isSliding) { setIsSliding(true); setGalleryIndex(i); } }}
                                aria-label={`Ir para item ${i + 1}`}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ─── CTA ─── */}
            <section className={`${styles.cta} ${styles.section}`}>
                <div className={styles.ctaBg} />
                <div ref={ctaReveal.ref} className={`${styles.ctaContent} ${ctaReveal.className}`}>
                    <h2 className={styles.ctaTitle}>GARANTA<br />O SEU</h2>
                    <p className={styles.ctaSubtitle}>Peças exclusivas da {org.name}. Edição limitada, feitas para quem respira vida universitária.</p>
                    {products.length > 0 ? (
                        <a href="#produtos" className={styles.btnPrimary}>Ver Produtos <IconArrowRight /></a>
                    ) : org.whatsapp ? (
                        <a href={`https://wa.me/${org.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className={styles.btnPrimary}>Fale Conosco <IconArrowRight /></a>
                    ) : null}
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <div className={styles.footerBrand}>
                        <div className={styles.footerLogo}>
                            <span className={styles.footerLogoMark}>
                                {org.logo_url ? <img src={org.logo_url} alt={org.name} className={styles.footerLogoMarkImg} /> : initials}
                            </span>
                            {org.name}
                        </div>
                        <p className={styles.footerTagline}>A força que move o espírito universitário.</p>
                    </div>
                    <div className={styles.footerLinks}>
                        <span className={styles.footerLinkTitle}>Navegação</span>
                        {products.length > 0 && <a href="#produtos" className={styles.footerLink}>Produtos</a>}
                        {org.about_text && <a href="#sobre" className={styles.footerLink}>Sobre</a>}
                        {hasGallery && <a href="#momentos" className={styles.footerLink}>Momentos</a>}
                        <Link href="/login" className={styles.footerLink}>Área do Membro</Link>
                    </div>
                    <div className={styles.footerSocials}>
                        {org.instagram_url && <a href={org.instagram_url} target="_blank" rel="noopener noreferrer" className={styles.footerSocial} aria-label="Instagram"><IconInstagram className={styles.footerSocialIcon} /></a>}
                        {org.twitter_url && <a href={org.twitter_url} target="_blank" rel="noopener noreferrer" className={styles.footerSocial} aria-label="Twitter"><IconTwitter className={styles.footerSocialIcon} /></a>}
                        {org.youtube_url && <a href={org.youtube_url} target="_blank" rel="noopener noreferrer" className={styles.footerSocial} aria-label="YouTube"><IconYoutube className={styles.footerSocialIcon} /></a>}
                        {org.whatsapp && <a href={`https://wa.me/${org.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className={styles.footerSocial} aria-label="WhatsApp"><IconWhatsApp className={styles.footerSocialIcon} /></a>}
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <span className={styles.footerCopy}>© {new Date().getFullYear()} <span className={styles.footerCopyAccent}>{org.name}</span>. Todos os direitos reservados.</span>
                    <Link href="/" className={styles.footerPowered}>Powered by <span className={styles.footerPoweredAccent}>Atlétics</span></Link>
                </div>
            </footer>
        </div>
    );
}
