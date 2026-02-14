/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

/* --- SVG Icons --- */
const IconArrowRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
);

const IconInstagram = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.sidebarSocialIcon}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);

const IconTwitter = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.sidebarSocialIcon}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const IconStore = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" /><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" /><path d="M12 3v6" />
    </svg>
);

const IconChart = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
    </svg>
);

const IconGlobe = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
    </svg>
);

const IconPalette = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r="2" /><circle cx="17.5" cy="10.5" r="2" /><circle cx="8.5" cy="7.5" r="2" /><circle cx="6.5" cy="12.5" r="2" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" />
    </svg>
);

const IconBell = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
);

const IconShield = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

const IconCheck = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

/* --- Data --- */
const FEATURES = [
    { icon: <IconStore />, title: "Loja Própria", desc: "Site personalizado com seus produtos, cores e identidade visual. Seus clientes compram direto da sua atlética." },
    { icon: <IconChart />, title: "Dashboard Completo", desc: "Vendas, estoque, entregas e financeiro — tudo num painel intuitivo com métricas em tempo real." },
    { icon: <IconGlobe />, title: "Sua Landing Page", desc: "Página profissional com partículas, animações e carrossel de fotos — tudo personalizado com suas cores." },
    { icon: <IconPalette />, title: "Cores da Sua Atlética", desc: "Tema dinâmico que adapta toda a plataforma às cores da sua atlética automaticamente." },
    { icon: <IconBell />, title: "Notificações Internas", desc: "Sistema de notificações entre membros para cancelamentos, erros e comunicação do time." },
    { icon: <IconShield />, title: "Controle de Acesso", desc: "Presidente e membros com permissões diferentes. Cada um vê só o que precisa." },
];

const PLANS = [
    {
        name: "Basic",
        price: "R$ 49",
        period: "/mês",
        desc: "Perfeito para atléticas que estão começando a se organizar.",
        features: ["Landing page personalizada", "Até 50 produtos", "Dashboard de vendas", "Controle de estoque", "2 membros", "Suporte por email"],
        highlight: false,
    },
    {
        name: "Pro",
        price: "R$ 99",
        period: "/mês",
        desc: "Para atléticas que querem o pacote completo e escalar.",
        features: ["Tudo do Basic", "Produtos ilimitados", "Membros ilimitados", "Notificações internas", "Galeria de fotos", "Relatórios avançados", "Suporte prioritário", "Domínio personalizado"],
        highlight: true,
    },
];

const TESTIMONIALS = [
    { name: "Lucas M.", role: "Presidente — Atlética FIPP", text: "Antes a gente controlava tudo em planilha. Com o Atlétics, em uma semana já organizamos todas as vendas e entregas. Nunca mais perdi uma venda." },
    { name: "Amanda S.", role: "Tesoureira — Atlética FAAG", text: "O dashboard é incrível. Consigo ver quanto vendemos, o que tem no estoque e quem entregou tudo. E a landing page ficou linda." },
    { name: "Rafael C.", role: "Presidente — Atlética UNESP", text: "A landing com as cores da nossa atlética impressionou todo mundo. Parece que contratamos uma agência, mas fizemos tudo sozinhos em 10 minutos." },
];

/* --- Canvas Particle Background --- */
function ParticleCanvas() {
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
                vx: 0, vy: 0,
                baseVx: Math.cos(angle) * speed,
                baseVy: Math.sin(angle) * speed,
                size: Math.random() * 2.5 + 1,
                alpha: Math.random() * 0.5 + 0.2,
                hue: 195 + Math.random() * 25,
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
                        ctx!.strokeStyle = `hsla(210, 100%, 70%, ${a})`;
                        ctx!.lineWidth = 0.6;
                        ctx!.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(draw);
        }

        draw();

        const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
        const onMouseMove = (e: MouseEvent) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY; };
        window.addEventListener("resize", onResize);
        window.addEventListener("mousemove", onMouseMove);
        return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); window.removeEventListener("mousemove", onMouseMove); };
    }, []);

    return <canvas ref={canvasRef} className={styles.canvasBg} />;
}

/* --- Custom Cursor --- */
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
        const onMouseMove = (e: MouseEvent) => { posRef.current.dotX = e.clientX; posRef.current.dotY = e.clientY; };
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
                ringRef.current.style.borderColor = hoverRef.current ? "rgba(0, 180, 255, 0.8)" : "rgba(0, 180, 255, 0.5)";
            }
            frameRef.current = requestAnimationFrame(animate);
        }
        frameRef.current = requestAnimationFrame(animate);
        window.addEventListener("mousemove", onMouseMove);
        const onOver = (e: Event) => { if ((e.target as HTMLElement).closest("a, button, [data-hover]")) hoverRef.current = true; };
        const onOut = (e: Event) => { if ((e.target as HTMLElement).closest("a, button, [data-hover]")) hoverRef.current = false; };
        document.addEventListener("mouseover", onOver);
        document.addEventListener("mouseout", onOut);
        return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener("mousemove", onMouseMove); document.removeEventListener("mouseover", onOver); document.removeEventListener("mouseout", onOut); };
    }, [isMobile]);

    if (isMobile) return null;
    return (
        <>
            <div ref={dotRef} className={styles.cursorDot} />
            <div ref={ringRef} className={styles.cursorRing} />
        </>
    );
}

/* --- Scroll Reveal Hook --- */
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

/* --- Staggered reveal --- */
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

/* --- GlowText --- */
function GlowText({ children, className }: { children: React.ReactNode; className?: string }) {
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
            el.style.backgroundImage = `radial-gradient(${spotSize}px circle at ${relX}% ${relY}%, rgba(0,180,255,${blueAlpha}), transparent 70%), linear-gradient(90deg, rgba(255,255,255,${whiteBase}), rgba(255,255,255,${whiteBase}))`;
            animRef.current = requestAnimationFrame(tick);
        }
        animRef.current = requestAnimationFrame(tick);
        window.addEventListener("mousemove", onMouseMove);
        return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("mousemove", onMouseMove); };
    }, []);

    return <span ref={wrapRef} className={className}>{children}</span>;
}

/* ===================================================================
   MAIN COMPONENT - Platform SaaS Landing
   =================================================================== */
export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const featuresHeader = useReveal("up");
    const featuresGrid = useStaggerReveal();
    const pricingHeader = useReveal("up");
    const pricingGrid = useStaggerReveal();
    const testimonialsHeader = useReveal("up");
    const testimonialsGrid = useStaggerReveal();
    const atleticasHeader = useReveal("up");
    const atleticasGrid = useStaggerReveal();
    const aboutLeft = useReveal("left");
    const aboutRight = useReveal("right");
    const ctaReveal = useReveal("scale");

    interface OrgCard {
        slug: string;
        name: string;
        logo_url: string | null;
        primary_color: string;
        secondary_color: string;
        accent_color: string;
        hero_subtitle: string | null;
    }
    const [orgs, setOrgs] = useState<OrgCard[]>([]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    useEffect(() => {
        async function fetchOrgs() {
            try {
                const res = await fetch("/api/orgs");
                if (!res.ok) {
                    console.error("Orgs API error status:", res.status);
                    return;
                }
                const json = await res.json();
                if (json.orgs && json.orgs.length > 0) {
                    setOrgs(json.orgs as OrgCard[]);
                }
            } catch (err) {
                console.error("Orgs fetch error:", err);
            }
        }
        fetchOrgs();
    }, []);

    const closeMenu = useCallback(() => setMenuOpen(false), []);

    return (
        <div className={styles.landing}>
            <ParticleCanvas />
            <CustomCursor />

            {/* Navbar */}
            <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ""}`}>
                <div className={styles.navLogo}>
                    <span className={styles.navLogoMark}>A</span>
                    Atlétics
                </div>
                <div className={styles.navDesktopLinks}>
                    <a href="#features" className={styles.navLink}>Features</a>
                    <a href="#atleticas" className={styles.navLink}>Atléticas</a>
                    <a href="#pricing" className={styles.navLink}>Planos</a>
                    <a href="#depoimentos" className={styles.navLink}>Depoimentos</a>
                    <a href="#sobre" className={styles.navLink}>Sobre</a>
                    <Link href="/login" className={styles.navCta}>Entrar</Link>
                </div>
                <button className={`${styles.menuToggle} ${menuOpen ? styles.menuToggleOpen : ""}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
                    <span className={styles.menuToggleLine} /><span className={styles.menuToggleLine} /><span className={styles.menuToggleLine} />
                </button>
            </nav>

            {/* Sidebar */}
            <div className={`${styles.sidebarOverlay} ${menuOpen ? styles.sidebarOverlayOpen : ""}`} onClick={closeMenu} />
            <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
                <a href="#features" className={styles.sidebarLink} onClick={closeMenu}>Features</a>
                <a href="#atleticas" className={styles.sidebarLink} onClick={closeMenu}>Atléticas</a>
                <a href="#pricing" className={styles.sidebarLink} onClick={closeMenu}>Planos</a>
                <a href="#depoimentos" className={styles.sidebarLink} onClick={closeMenu}>Depoimentos</a>
                <a href="#sobre" className={styles.sidebarLink} onClick={closeMenu}>Sobre</a>
                <Link href="/login" className={styles.sidebarLink} onClick={closeMenu}>Entrar</Link>
                <div className={styles.sidebarSocials}>
                    <a href="#" className={styles.sidebarSocialLink} aria-label="Instagram"><IconInstagram /></a>
                    <a href="#" className={styles.sidebarSocialLink} aria-label="Twitter"><IconTwitter /></a>
                </div>
            </aside>

            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroGlow} />
                <div className={styles.heroContent}>
                    <span className={styles.heroTag}>
                        A plataforma das atléticas universitárias
                    </span>
                    <h1 className={styles.heroTitle}>
                        SUA ATLÉTICA{" "}
                        <GlowText className={styles.heroTitleAccent}>DIGITAL</GlowText>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Vendas, estoque, entregas e uma landing page incrível &mdash; tudo em um só lugar.
                        Monte sua loja em minutos e gerencie sua atlética como nunca.
                    </p>
                    <div className={styles.heroCtas}>
                        <Link href="/signup" className={styles.btnPrimary}>
                            Comece Grátis <IconArrowRight />
                        </Link>
                        <a href="#features" className={styles.btnOutline}>
                            Ver Features
                        </a>
                    </div>
                    <p style={{ marginTop: 16, fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>
                        14 dias grátis &middot; Sem cartão de crédito
                    </p>
                </div>
                <div className={styles.heroScrollIndicator}>
                    <div className={styles.heroScrollLine} />
                    <span className={styles.heroScrollText}>Scroll</span>
                </div>
            </section>

            {/* Features */}
            <section id="features" className={`${styles.products} ${styles.section}`}>
                <div className={styles.productsInner}>
                    <div ref={featuresHeader.ref} className={featuresHeader.className}>
                        <div className={styles.sectionHeader}>
                            <p className={styles.sectionTag}><span className={styles.sectionTagLine} />Plataforma</p>
                            <h2 className={styles.sectionTitle}>TUDO QUE SUA <span className={styles.sectionTitleAccent}>ATLÉTICA</span> PRECISA</h2>
                        </div>
                    </div>
                    <div ref={featuresGrid.ref} className={styles.productsGrid}>
                        {FEATURES.map((feature, i) => (
                            <div key={i} className={styles.productCard} style={featuresGrid.getChildStyle(i)} data-hover>
                                <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
                                    <div style={{
                                        width: 56, height: 56,
                                        background: "linear-gradient(135deg, rgba(0,180,255,0.12), rgba(0,102,255,0.08))",
                                        borderRadius: 14,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: "#00B4FF",
                                    }}>
                                        {feature.icon}
                                    </div>
                                    <div className={styles.productInfo} style={{ padding: 0 }}>
                                        <h3 className={styles.productName} style={{ marginBottom: 8 }}>{feature.title}</h3>
                                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", lineHeight: 1.65 }}>
                                            {feature.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className={`${styles.gallery} ${styles.section}`}>
                <div ref={pricingHeader.ref} className={`${styles.galleryHeader} ${pricingHeader.className}`}>
                    <p className={styles.sectionTag}><span className={styles.sectionTagLine} />Planos</p>
                    <h2 className={styles.sectionTitle}>PREÇOS <span className={styles.sectionTitleAccent}>SIMPLES</span></h2>
                </div>
                <div ref={pricingGrid.ref} style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
                    {PLANS.map((plan, i) => (
                        <div key={i} style={{
                            ...pricingGrid.getChildStyle(i),
                            flex: "1 1 340px",
                            maxWidth: 420,
                            background: plan.highlight ? "linear-gradient(135deg, rgba(0,180,255,0.08), rgba(0,102,255,0.04))" : "rgba(255,255,255,0.02)",
                            border: plan.highlight ? "1px solid rgba(0,180,255,0.25)" : "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 20,
                            padding: "40px 32px",
                            position: "relative" as const,
                            overflow: "hidden" as const,
                        }} data-hover>
                            {plan.highlight && (
                                <span style={{
                                    position: "absolute" as const, top: 16, right: 16,
                                    background: "linear-gradient(135deg, #00B4FF, #0066FF)",
                                    color: "#fff", fontSize: "0.65rem", fontWeight: 700,
                                    letterSpacing: "0.12em", textTransform: "uppercase" as const,
                                    padding: "5px 12px", borderRadius: 50,
                                }}>Popular</span>
                            )}
                            <p style={{ color: "#00B4FF", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 8 }}>{plan.name}</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                                <span style={{ fontSize: "2.8rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{plan.price}</span>
                                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>{plan.period}</span>
                            </div>
                            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 28 }}>{plan.desc}</p>
                            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12, marginBottom: 32 }}>
                                {plan.features.map((f, fi) => (
                                    <div key={fi} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ color: "#00B4FF", flexShrink: 0 }}><IconCheck /></span>
                                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>{f}</span>
                                    </div>
                                ))}
                            </div>
                            <Link href="/signup" className={plan.highlight ? styles.btnPrimary : styles.btnOutline} style={{ display: "flex", justifyContent: "center", width: "100%", textAlign: "center" as const }}>
                                Começar {plan.name} <IconArrowRight />
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials */}
            <section id="depoimentos" className={`${styles.products} ${styles.section}`}>
                <div className={styles.productsInner}>
                    <div ref={testimonialsHeader.ref} className={testimonialsHeader.className}>
                        <div className={styles.sectionHeader}>
                            <p className={styles.sectionTag}><span className={styles.sectionTagLine} />Depoimentos</p>
                            <h2 className={styles.sectionTitle}>QUEM <span className={styles.sectionTitleAccent}>USA</span></h2>
                        </div>
                    </div>
                    <div ref={testimonialsGrid.ref} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24, width: "100%" }}>
                        {TESTIMONIALS.map((t, i) => (
                            <div key={i} style={{
                                ...testimonialsGrid.getChildStyle(i),
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: 20,
                                padding: "32px 28px",
                            }} data-hover>
                                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                                    <div style={{
                                        width: 44, height: 44,
                                        background: "linear-gradient(135deg, #00B4FF, #0066FF)",
                                        borderRadius: 12,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "0.9rem", fontWeight: 800, color: "#fff",
                                    }}>
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <p style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 700 }}>{t.name}</p>
                                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>{t.role}</p>
                                    </div>
                                </div>
                                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem", lineHeight: 1.7, fontStyle: "italic" }}>
                                    &ldquo;{t.text}&rdquo;
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Atléticas Showcase */}
            <section id="atleticas" className={`${styles.products} ${styles.section}`}>
                <div className={styles.productsInner}>
                    <div ref={atleticasHeader.ref} className={atleticasHeader.className}>
                        <div className={styles.sectionHeader}>
                            <p className={styles.sectionTag}><span className={styles.sectionTagLine} />Vitrine</p>
                            <h2 className={styles.sectionTitle}>ATLÉTICAS QUE <span className={styles.sectionTitleAccent}>JÁ USAM</span></h2>
                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem", maxWidth: 520, margin: "12px auto 0", textAlign: "center", lineHeight: 1.65 }}>
                                Conheça as atléticas que já estão no Atlétics. Clique para visitar o site e ver os produtos.
                            </p>
                        </div>
                    </div>
                    <div ref={atleticasGrid.ref} className={styles.atleticasGrid}>
                        {orgs.map((org, i) => (
                            <Link
                                key={org.slug}
                                href={`/a/${org.slug}`}
                                className={styles.atleticaCard}
                                style={atleticasGrid.getChildStyle(i)}
                                data-hover
                            >
                                <div
                                    className={styles.atleticaCardGlow}
                                    style={{
                                        background: `radial-gradient(circle at 30% 30%, ${org.primary_color}22, transparent 70%)`,
                                    }}
                                />
                                <div className={styles.atleticaCardInner}>
                                    <div
                                        className={styles.atleticaLogo}
                                        style={{
                                            background: `linear-gradient(135deg, ${org.primary_color}, ${org.secondary_color})`,
                                        }}
                                    >
                                        {org.logo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={org.logo_url} alt={org.name} className={styles.atleticaLogoImg} />
                                        ) : (
                                            <span className={styles.atleticaLogoLetter}>
                                                {org.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.atleticaInfo}>
                                        <h3 className={styles.atleticaName}>{org.name}</h3>
                                        {org.hero_subtitle && (
                                            <p className={styles.atleticaSub}>{org.hero_subtitle}</p>
                                        )}
                                    </div>
                                    <div className={styles.atleticaColors}>
                                        <span className={styles.atleticaColorDot} style={{ background: org.primary_color }} />
                                        <span className={styles.atleticaColorDot} style={{ background: org.secondary_color }} />
                                        <span className={styles.atleticaColorDot} style={{ background: org.accent_color }} />
                                    </div>
                                    <span className={styles.atleticaArrow}>
                                        Visitar →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* About */}
            <section id="sobre" className={`${styles.about} ${styles.section}`}>
                <div className={styles.aboutInner}>
                    <div ref={aboutLeft.ref} className={aboutLeft.className}>
                        <div className={styles.sectionHeader}>
                            <p className={styles.sectionTag}><span className={styles.sectionTagLine} />Sobre</p>
                            <h2 className={styles.sectionTitle}>O <span className={styles.sectionTitleAccent}>ATLÉTICS</span></h2>
                        </div>
                        <p className={styles.aboutText}>
                            O <span className={styles.aboutHighlight}>Atlétics</span> nasceu da necessidade real de
                            organizar uma atlética universitária. Planilhas, grupos de WhatsApp, anotações em
                            caderno &mdash; nada funcionava direito.
                        </p>
                        <p className={styles.aboutText}>
                            Criamos uma plataforma onde qualquer atlética pode ter sua{" "}
                            <span className={styles.aboutHighlight}>loja online</span>, controlar{" "}
                            <span className={styles.aboutHighlight}>estoque e entregas</span>, e ter uma{" "}
                            <span className={styles.aboutHighlight}>landing page profissional</span> &mdash; tudo
                            com as cores e identidade da sua atlética.
                        </p>
                        <div className={styles.aboutStats}>
                            <div className={styles.aboutStat}>
                                <span className={styles.aboutStatValue}>50+</span>
                                <span className={styles.aboutStatLabel}>Atléticas</span>
                            </div>
                            <div className={styles.aboutStat}>
                                <span className={styles.aboutStatValue}>5k+</span>
                                <span className={styles.aboutStatLabel}>Vendas</span>
                            </div>
                            <div className={styles.aboutStat}>
                                <span className={styles.aboutStatValue}>99%</span>
                                <span className={styles.aboutStatLabel}>Satisfação</span>
                            </div>
                        </div>
                    </div>
                    <div ref={aboutRight.ref} className={aboutRight.className}>
                        <div className={styles.aboutVisual}>
                            <div className={styles.aboutVisualGlow} />
                            <div className={styles.aboutVisualOrb} />
                            <div style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 2,
                            }}>
                                <span style={{
                                    fontSize: "clamp(4rem, 8vw, 7rem)",
                                    fontWeight: 900,
                                    color: "rgba(255,255,255,0.04)",
                                    letterSpacing: "-0.04em",
                                    userSelect: "none",
                                    textTransform: "uppercase",
                                }}>Atlétics</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={`${styles.cta} ${styles.section}`}>
                <div className={styles.ctaBg} />
                <div ref={ctaReveal.ref} className={`${styles.ctaContent} ${ctaReveal.className}`}>
                    <h2 className={styles.ctaTitle}>COMECE<br />AGORA</h2>
                    <p className={styles.ctaSubtitle}>
                        14 dias grátis. Sem cartão. Sua atlética online em minutos.
                    </p>
                    <Link href="/signup" className={styles.btnPrimary}>
                        Criar Minha Atlética <IconArrowRight />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <div className={styles.footerBrand}>
                        <div className={styles.footerLogo}>
                            <span className={styles.footerLogoMark}>A</span>
                            Atlétics
                        </div>
                        <p className={styles.footerTagline}>
                            A plataforma que digitaliza sua atlética universitária.
                        </p>
                    </div>
                    <div className={styles.footerLinks}>
                        <span className={styles.footerLinkTitle}>Navegação</span>
                        <a href="#features" className={styles.footerLink}>Features</a>
                        <a href="#atleticas" className={styles.footerLink}>Atléticas</a>
                        <a href="#pricing" className={styles.footerLink}>Planos</a>
                        <a href="#depoimentos" className={styles.footerLink}>Depoimentos</a>
                        <a href="#sobre" className={styles.footerLink}>Sobre</a>
                        <Link href="/login" className={styles.footerLink}>Entrar</Link>
                    </div>
                    <div className={styles.footerSocials}>
                        <a href="#" className={styles.footerSocial} aria-label="Instagram"><IconInstagram /></a>
                        <a href="#" className={styles.footerSocial} aria-label="Twitter"><IconTwitter /></a>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <span className={styles.footerCopy}>
                        © {new Date().getFullYear()} <span className={styles.footerCopyAccent}>Atlétics</span>. Todos os direitos reservados.
                    </span>
                </div>
            </footer>
        </div>
    );
}
