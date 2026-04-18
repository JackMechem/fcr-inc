import styles from "./inventoryPanel.module.css";

export const LoadingSkeleton = ({ label }: { label: string }) => (
    <div style={{ padding: "32px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-foreground-light)", marginBottom: 4 }}>
            <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: "spin 1s linear infinite" }}
            >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span style={{ fontSize: "10pt" }}>{label}</span>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
            <div
                key={i}
                style={{
                    height: 52,
                    borderRadius: 12,
                    background: "var(--color-third)",
                    opacity: 0.35 - i * 0.05,
                    animation: "pulse 1.6s ease-in-out infinite",
                    animationDelay: `${i * 80}ms`,
                }}
            />
        ))}
        <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes pulse { 0%,100%{opacity:0.35}50%{opacity:0.15} }
        `}</style>
    </div>
);

export const EmptyState = ({ icon, message }: { icon: React.ReactNode; message: string }) => (
    <div
        style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            gap: 8,
            color: "var(--color-foreground-light)",
        }}
    >
        <span style={{ fontSize: "36pt", opacity: 0.3 }}>{icon}</span>
        <p style={{ fontSize: "11pt" }}>{message}</p>
    </div>
);
