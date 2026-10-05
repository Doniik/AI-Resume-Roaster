import { useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useToast } from '../components/ToastProvider';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export default function UploadPage() {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roast, setRoast] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  function handleFileChange(e) {
    setError(null);
    setRoast(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      const msg = 'Only PDF files are allowed.';
      setError(msg);
      showToast(msg, 'error');
      setFile(null);
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      const msg = 'File is larger than the 10MB limit.';
      setError(msg);
      showToast(msg, 'error');
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (!droppedFile) return;

    const dt = new DataTransfer();
    dt.items.add(droppedFile);
    if (inputRef.current) {
      inputRef.current.files = dt.files;
    }
    handleFileChange({ target: { files: dt.files } });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setError(null);
    setRoast(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/roast', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        showToast(data.error || 'Something went wrong.', 'error');
        return;
      }

      setRoast(data.roast);
      showToast('Roast completed and saved successfully.', 'success');
    } catch (err) {
      const msg = 'Network error. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return <main className="page-shell"><div className="card loading-card">Loading...</div></main>;
  }

  if (status === 'unauthenticated') {
    return (
      <main className="page-shell auth-shell">
        <div className="card auth-card">
          <span className="eyebrow">AI Resume Roaster</span>
          <h1>Sign in to roast your resume.</h1>
          <p>Get honest AI feedback on your resume and save your review history.</p>
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
        <section className="hero-panel card compact-hero">
          <div className="hero-copy">
            <span className="eyebrow">Resume review</span>
            <h1>Roast your resume.</h1>
            <p>Get honest AI feedback on your resume — what works, what doesn’t, and what you should fix.</p>
          </div>
        </section>

        <section className="card upload-card">
          <form onSubmit={handleSubmit} className="upload-form">
            <div
              className={`dropzone ${dragActive ? 'dragging' : ''}`}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                disabled={loading}
                className="sr-only"
                aria-label="Upload PDF resume"
              />

              <div className="dropzone-icon">📄</div>
              <div className="dropzone-title">Drop your resume here</div>
              <div className="dropzone-subtitle">or click to browse</div>
              <div className="dropzone-meta">PDF files up to 10MB</div>
            </div>

            {file && (
              <div className="file-pill" aria-live="polite">
                <span className="file-pill-icon">📄</span>
                <div className="file-pill-text">
                  <strong>{file.name}</strong>
                  <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                </div>
                <button type="button" className="remove-file" onClick={() => setFile(null)}>
                  Remove
                </button>
              </div>
            )}

            <button type="submit" className="btn btn-primary big-btn" disabled={!file || loading}>
              {loading ? '🔥 Roasting...' : '🔥 Roast My Resume'}
            </button>
          </form>

          {loading && <p className="status-text" role="status">Analyzing your resume, this can take a few seconds...</p>}

          {error && (
            <div className="error-card" role="alert">
              <div className="error-icon">⚠</div>
              <div>
                <h3>Something went wrong</h3>
                <p>{error}</p>
                <button type="button" className="btn btn-secondary small-btn" onClick={() => setError(null)}>
                  Try again
                </button>
              </div>
            </div>
          )}
        </section>

        {roast && (
          <section className="card results-card">
            <div className="score-row">
              <div>
                <span className="eyebrow">Resume score</span>
                <h2>{roast.score} / 100</h2>
              </div>
            </div>

            <div className="results-grid">
              <article className="result-panel">
                <h3>✓ Strengths</h3>
                <ul className="result-list">
                  {roast.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </article>

              <article className="result-panel">
                <h3>⚠ Weaknesses</h3>
                <ul className="result-list">
                  {roast.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </article>

              <article className="result-panel">
                <h3>💡 Actionable Tips</h3>
                <ul className="result-list">
                  {roast.actionable_tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </article>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}