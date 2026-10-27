import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Zap, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Spinner } from '../components/UIStates';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const from = location.state?.from?.pathname || null;
  const sessionExpired = new URLSearchParams(location.search).get('session') === 'expired';

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      const dashMap = { admin: '/admin', staff: '/staff', student: '/dashboard' };
      navigate(from || dashMap[user.role] || '/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
    setErrors({});
    setApiError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--color-navy)',
    }} className="grid-pattern-dark">
      {/* Left — branding */}
      <div className="hide-mobile" style={{
        width: '45%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--space-16)',
        position: 'relative',
      }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-slate)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-12)', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          <div style={{ width: 48, height: 48, background: 'var(--color-lime)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={24} color="var(--color-navy)" fill="var(--color-navy)" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 'var(--text-2xl)', color: 'var(--color-paper)', letterSpacing: '-0.02em' }}>
            Campus<span style={{ color: 'var(--color-lime)' }}>Fix</span>
          </span>
        </div>

        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, color: 'var(--color-paper)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 'var(--space-4)' }}>
          Campus<br />operations,<br />
          <span style={{ color: 'var(--color-lime)' }}>simplified.</span>
        </h1>
        <p style={{ color: 'rgba(245,242,233,0.6)', fontSize: 'var(--text-base)', lineHeight: 1.7 }}>
          Sign in to track, manage, and resolve campus maintenance issues efficiently.
        </p>
      </div>

      {/* Right — form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)',
        background: 'var(--color-paper)',
        borderRadius: 'var(--radius-2xl) 0 0 var(--radius-2xl)',
      }} className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="show-mobile-only" style={{ marginBottom: 'var(--space-8)' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-slate)', fontSize: 'var(--text-sm)' }}>
              <ArrowLeft size={16} />
              Home
            </Link>
          </div>

          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-navy)', marginBottom: 'var(--space-2)', letterSpacing: '-0.02em' }}>
            Sign in
          </h2>
          <p style={{ color: 'var(--color-slate)', marginBottom: 'var(--space-8)', fontSize: 'var(--text-sm)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-navy)', fontWeight: 600, textDecoration: 'underline' }}>
              Create one
            </Link>
          </p>

          {sessionExpired && (
            <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
              Your session expired. Please sign in again.
            </div>
          )}

          {apiError && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div className="form-group">
                <label className="form-label required" htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="you@campus.edu"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
                  autoComplete="email"
                  disabled={loading}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="login-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
                    autoComplete="current-password"
                    disabled={loading}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-slate)',
                      lineHeight: 0,
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <button
                type="submit"
                className="btn btn-secondary w-full"
                disabled={loading}
                style={{ justifyContent: 'center', padding: '0.75rem' }}
                id="login-submit"
              >
                {loading ? <><Spinner size="sm" variant="white" /> Signing in…</> : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Demo credentials 1-click fill */}
          <div style={{
            marginTop: 'var(--space-6)',
            padding: 'var(--space-4)',
            background: 'var(--color-paper-200)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-slate-dark)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              Quick Demo Fill (Click to populate):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => fillDemo('admin@campusfix.demo', 'Admin@123')}
                style={{ fontSize: '11px', padding: '6px 4px', textAlign: 'center', justifyContent: 'center' }}
                title="Fill Admin credentials"
              >
                🛡️ Admin
              </button>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => fillDemo('staff@campusfix.demo', 'Staff@123')}
                style={{ fontSize: '11px', padding: '6px 4px', textAlign: 'center', justifyContent: 'center' }}
                title="Fill Maintenance Staff credentials"
              >
                🔧 Staff
              </button>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => fillDemo('student@campusfix.demo', 'Student@123')}
                style={{ fontSize: '11px', padding: '6px 4px', textAlign: 'center', justifyContent: 'center' }}
                title="Fill Student credentials"
              >
                🎓 Student
              </button>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-slate)', marginTop: 'var(--space-2)' }}>
              Click any role above, then hit <strong>Sign In</strong> to explore that dashboard.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
