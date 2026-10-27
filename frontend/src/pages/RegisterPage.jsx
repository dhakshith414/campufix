import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Zap, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { Spinner } from '../components/UIStates';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', department: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = 'Must contain uppercase, lowercase, and a number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const passwordStrength = () => {
    if (!form.password) return 0;
    let score = 0;
    if (form.password.length >= 8) score++;
    if (/[A-Z]/.test(form.password)) score++;
    if (/[a-z]/.test(form.password)) score++;
    if (/\d/.test(form.password)) score++;
    if (/[^A-Za-z\d]/.test(form.password)) score++;
    return score;
  };

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['', 'var(--color-coral)', 'var(--color-amber)', '#3b82f6', 'var(--color-success)', 'var(--color-lime-dark)'];
  const strength = passwordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        department: form.department.trim(),
      });
      toast.success(`Welcome to CampusFix, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--color-navy)' }} className="grid-pattern-dark">
      {/* Left panel */}
      <div className="hide-mobile" style={{
        width: '40%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--space-16)',
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

        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, color: 'var(--color-paper)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 'var(--space-6)' }}>
          Join your<br />campus<br />
          <span style={{ color: 'var(--color-lime)' }}>community.</span>
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {['Report issues in under a minute', 'Track progress with full transparency', 'Get notified when your issue is resolved'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'rgba(245,242,233,0.8)', fontSize: 'var(--text-sm)' }}>
              <CheckCircle size={16} color="var(--color-lime)" />
              {t}
            </div>
          ))}
        </div>
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
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 440, padding: 'var(--space-4) 0' }}>
          <div className="show-mobile-only" style={{ marginBottom: 'var(--space-6)' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-slate)', fontSize: 'var(--text-sm)' }}>
              <ArrowLeft size={16} /> Home
            </Link>
          </div>

          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-navy)', marginBottom: 'var(--space-2)', letterSpacing: '-0.02em' }}>
            Create account
          </h2>
          <p style={{ color: 'var(--color-slate)', marginBottom: 'var(--space-8)', fontSize: 'var(--text-sm)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-navy)', fontWeight: 600, textDecoration: 'underline' }}>Sign in</Link>
          </p>

          {apiError && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{apiError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label required" htmlFor="reg-name">Full name</label>
                <input id="reg-name" type="text" className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Your full name" value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
                  autoComplete="name" disabled={loading} />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="reg-email">Email address</label>
                <input id="reg-email" type="email" className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="you@campus.edu" value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
                  autoComplete="email" disabled={loading} />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-dept">Department (optional)</label>
                <input id="reg-dept" type="text" className="form-input"
                  placeholder="e.g. Computer Science" value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  disabled={loading} />
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="reg-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="reg-password" type={showPassword ? 'text' : 'password'}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Min. 8 chars, with uppercase, lowercase, number"
                    value={form.password}
                    onChange={e => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
                    autoComplete="new-password" disabled={loading} style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate)', lineHeight: 0 }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: i <= strength ? strengthColors[strength] : 'var(--color-paper-300)',
                        transition: 'background 0.2s',
                      }} />
                    ))}
                    <span style={{ fontSize: 'var(--text-xs)', color: strengthColors[strength], fontWeight: 600, marginLeft: 6 }}>
                      {strengthLabels[strength]}
                    </span>
                  </div>
                )}
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="reg-confirm">Confirm password</label>
                <input id="reg-confirm" type="password"
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Repeat your password" value={form.confirmPassword}
                  onChange={e => { setForm({ ...form, confirmPassword: e.target.value }); setErrors({ ...errors, confirmPassword: '' }); }}
                  autoComplete="new-password" disabled={loading} />
                {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" className="btn btn-secondary w-full" disabled={loading}
                style={{ justifyContent: 'center', padding: '0.75rem', marginTop: 'var(--space-2)' }} id="register-submit">
                {loading ? <><Spinner size="sm" variant="white" /> Creating account…</> : 'Create Account'}
              </button>
            </div>
          </form>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)', marginTop: 'var(--space-6)', textAlign: 'center', lineHeight: 1.5 }}>
            By creating an account, you agree to use CampusFix only for legitimate campus maintenance reporting.
          </p>
        </div>
      </div>
    </div>
  );
}
