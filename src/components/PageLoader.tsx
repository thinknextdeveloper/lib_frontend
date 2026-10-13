const css = `
  .pl-spinner {
    width: 36px;
    height: 36px;
    margin: 16px auto 20px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: var(--accent, #6366f1);
    animation: pl-spin 0.8s linear infinite;
  }

  .pl-pulse {
    animation: pl-pulse 1.6s ease-in-out infinite;
  }

  @keyframes pl-spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pl-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.08); opacity: 0.8; }
  }
`;

export default function PageLoader({
  text = "Loading your library...",
}: {
  text?: string;
}) {
  return (
    <div className="nf-wrap">
      <style>{css}</style>
      <div className="nf-card">
        <div className="nf-icon pl-pulse">📚</div>
        <div className="pl-spinner" aria-hidden="true" />
        <h1>Loading</h1>
        <p className="nf-text">{text}</p>
      </div>
    </div>
  );
}