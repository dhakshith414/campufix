import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-navy)',
      flexDirection: 'column',
      gap: 'var(--space-6)',
      padding: 'var(--space-8)',
      textAlign: 'center',
    }} className="grid-pattern-dark">
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '6rem', fontWeight: 900, color: 'var(--color-lime)', lineHeight: 1, letterSpacing: '-0.04em' }}>
        404
      </div>
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-paper)', marginBottom: 'var(--space-3)' }}>
          Page not found
        </h1>
        <p style={{ color: 'rgba(245,242,233,0.6)', maxWidth: 400 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button onClick={() => window.history.back()} className="btn btn-outline-light">
          <ArrowLeft size={16} /> Go Back
        </button>
        <Link to="/" className="btn btn-primary">
          <Home size={16} /> Home
        </Link>
      </div>
    </div>
  );
}

export function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-navy)',
      flexDirection: 'column',
      gap: 'var(--space-6)',
      padding: 'var(--space-8)',
      textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '6rem', fontWeight: 900, color: 'var(--color-coral)', lineHeight: 1 }}>
        403
      </div>
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-paper)', marginBottom: 'var(--space-3)' }}>
          Access Denied
        </h1>
        <p style={{ color: 'rgba(245,242,233,0.6)', maxWidth: 400 }}>
          You don't have permission to access this page.
        </p>
      </div>
      <Link to="/dashboard" className="btn btn-primary">
        <Home size={16} /> Dashboard
      </Link>
    </div>
  );
}
