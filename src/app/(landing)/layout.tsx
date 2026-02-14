export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ backgroundColor: "#050508", minHeight: "100vh" }}>
            {children}
        </div>
    );
}
