import Head from 'next/head';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <>
      <Head>
        <title>AI Resume Roaster</title>
        <meta
          name="description"
          content="Roast your resume with AI feedback on strengths, weaknesses, and actionable improvements."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

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
              {status === 'authenticated' ? (
                <>
                  <span className="user-pill">{session?.user?.email}</span>
                  <button type="button" className="nav-button subtle" onClick={() => signOut()}>
                    Sign out
                  </button>
                </>
              ) : (
                <button type="button" className="nav-button" onClick={() => signIn('google')}>
                  Sign in
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="container page-section">
          <section className="hero-panel card">
            <div className="hero-copy">
              <span className="eyebrow">AI career feedback</span>
              <h1>Roast your resume.</h1>
              <p>
                Honest feedback on what works, what doesn’t, and what to fix before the next application.
              </p>
              <div className="hero-actions">
                <Link href="/upload" className="btn btn-primary">
                  🔥 Roast My Resume
                </Link>
                <Link href="/history" className="btn btn-secondary">
                  View history
                </Link>
              </div>
            </div>

            <div className="hero-summary">
              <div className="summary-box">
                <span>Resume score</span>
                <strong>82/100</strong>
              </div>
              <div className="summary-list">
                <div>
                  <span>Strengths</span>
                  <p>Clear impact and measurable results.</p>
                </div>
                <div>
                  <span>Weaknesses</span>
                  <p>Missing stronger keyword alignment.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="steps-grid">
            <div className="feature-card card">
              <span className="feature-number">01</span>
              <h2>Upload</h2>
              <p>Drop in your PDF and get started in seconds.</p>
            </div>
            <div className="feature-card card">
              <span className="feature-number">02</span>
              <h2>Review</h2>
              <p>Get honest strengths, gaps, and practical feedback.</p>
            </div>
            <div className="feature-card card">
              <span className="feature-number">03</span>
              <h2>Improve</h2>
              <p>Fix the weak spots and submit with more confidence.</p>
            </div>
          </section>

          <section className="cta-band card">
            <div>
              <span className="eyebrow">Ready?</span>
              <h2>Turn a good resume into a stronger one.</h2>
            </div>
            <Link href="/upload" className="btn btn-primary">
              🔥 Roast My Resume
            </Link>
          </section>
        </main>
      </div>
    </>
  );
}
