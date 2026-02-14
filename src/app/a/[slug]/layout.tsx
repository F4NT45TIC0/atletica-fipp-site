export default function OrgLandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#050508" }}>
            {children}
        </div>
    );
}
