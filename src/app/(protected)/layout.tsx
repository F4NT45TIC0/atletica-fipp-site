import ProtectedShell from "@/components/layout/ProtectedShell";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProtectedShell>{children}</ProtectedShell>;
}
