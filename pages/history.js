import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const [roasts, setRoasts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status !== 'authenticated') return;

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/history');
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error || 'Could not load history.');
          return;
        }
        if (!cancelled) setRoasts(data.roasts);
      } catch (err) {
        if (!cancelled) setError('Network error while loading history.');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === 'loading') {
    return <main className="page-shell"><div className="card loading-card">Loading...</div></main>;
  }

  if (status === 'unauthenticated') {
    return (
      <main className="page-shell auth-shell">
        <div className="card auth-card">
          <span className="eyebrow">AI Resume Roaster</span>
          <h1>You need to sign in to view your roast history.</h1>
          <button type="button" className="btn btn-primary" onClick={() => signIn('google')}>
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="AI Resume Roaster home">
            <span className="brand-mark">🔥</span>
            <span>AI Resume Roaster</span>
          </Link>

          <nav className="top-nav" aria-label="Main navigation">
            <Link href="/upload">Upload</Link>
            <Link href="/history">History</Link>
          </nav>

          <div className="header-actions">
            <span className="user-pill">{session?.user?.email}</span>
            <button type="button" className="nav-button subtle" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container page-section">
        <section className="hero-panel card compact-hero history-hero">
          <div className="hero-copy">
            <span className="eyebrow">Resume history</span>
            <h1>Your Resume History</h1>
          </div>
        </section>

        <section className="card history-card">
          {error && (
            <div className="error-card" role="alert">
              <div className="error-icon">⚠</div>
              <div>
                <h3>Something went wrong</h3>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!error && roasts === null && <p className="muted-copy">Loading your previous roasts...</p>}

          {!error && roasts && roasts.length === 0 && (
            <div className="empty-state-panel">
              <h3>No roasts yet.</h3>
              <p>Upload your resume to get your first AI review.</p>
              <Link href="/upload" className="btn btn-primary">
                🔥 Roast My Resume
              </Link>
            </div>
          )}

          {!error && roasts && roasts.length > 0 && (
            <ul className="history-list">
              {roasts.map((r) => (
                <li key={r.id} className="history-item">
                  <div className="history-head">
                    <div>
                      <div className="history-label">Resume review</div>
                      <strong className="history-score">Score: {r.roast_json?.score ?? 'N/A'} / 100</strong>
                    </div>
                    <span className="history-date">{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  {Array.isArray(r.roast_json?.actionable_tips) && r.roast_json.actionable_tips.length > 0 && (
                    <p className="history-tip">{r.roast_json.actionable_tips[0]}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}