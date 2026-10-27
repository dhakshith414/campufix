import { Link } from 'react-router-dom';
import { Zap, ArrowRight, CheckCircle, Shield, Clock, BarChart2, ChevronRight } from 'lucide-react';

const statusSteps = [
  { label: 'Submitted', color: 'var(--color-slate)', desc: 'Report filed' },
  { label: 'Acknowledged', color: 'var(--color-amber)', desc: 'Received by staff' },
  { label: 'In Progress', color: '#8b5cf6', desc: 'Work underway' },
  { label: 'Resolved', color: 'var(--color-success)', desc: 'Issue fixed' },
];

const features = [
  {
    icon: <Clock size={24} />,
    title: 'Report in Under a Minute',
    description: 'Structured forms guide you to the right information quickly. No long phone calls or lost emails.',
  },
  {
    icon: <CheckCircle size={24} />,
    title: 'Transparent Progress',
    description: 'Track every status change in real time. Know exactly when your issue was acknowledged and resolved.',
  },
  {
    icon: <Shield size={24} />,
    title: 'Accountable Workflow',
    description: 'Every action is recorded. Staff assignments, status changes, and resolution notes form a complete audit trail.',
  },
  {
    icon: <BarChart2 size={24} />,
    title: 'Campus-Wide Oversight',
    description: 'Administrators see live metrics, identify recurring problems, and manage resources efficiently.',
  },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-paper)' }}>
      {/* Navigation */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(245,242,233,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-paper-300)',
      }}>
        <div className="container" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 36, height: 36,
              background: 'var(--color-navy)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={18} color="var(--color-lime)" fill="var(--color-lime)" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 'var(--text-xl)', color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
              Campus<span style={{ color: 'var(--color-coral)' }}>Fix</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Link to="/login" className="btn btn-ghost" style={{ color: 'var(--color-navy)' }}>
              Log In
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'var(--color-navy)',
        position: 'relative',
        overflow: 'hidden',
        padding: 'var(--space-24) 0',
      }} className="grid-pattern-dark">
        {/* Decorative circle */}
        <div style={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,240,107,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: 'rgba(201,240,107,0.12)',
            border: '1px solid rgba(201,240,107,0.25)',
            borderRadius: 'var(--radius-full)',
            padding: '0.375rem var(--space-4)',
            marginBottom: 'var(--space-8)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--color-lime)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-lime)', display: 'inline-block' }} />
            Smart Campus Maintenance Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 900,
            color: 'var(--color-paper)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            maxWidth: 800,
            marginBottom: 'var(--space-6)',
          }}>
            A better campus starts with{' '}
            <span style={{
              color: 'var(--color-lime)',
              display: 'inline-block',
            }}>
              a reported issue.
            </span>
          </h1>

          <p style={{
            fontSize: 'var(--text-xl)',
            color: 'rgba(245,242,233,0.7)',
            maxWidth: 580,
            lineHeight: 1.7,
            marginBottom: 'var(--space-10)',
          }}>
            CampusFix gives your campus community a central, accountable place to report
            and resolve maintenance problems — transparently, efficiently, and on record.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Report an Issue
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-outline-light btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Status Lifecycle Preview */}
      <section style={{ padding: 'var(--space-16) 0', background: 'var(--color-navy-800)' }}>
        <div className="container">
          <p style={{
            textAlign: 'center',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-slate)',
            marginBottom: 'var(--space-8)',
          }}>
            Issue Lifecycle — Full Visibility at Every Step
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {statusSteps.map((step, i) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: step.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 800,
                    color: 'white',
                    boxShadow: `0 0 20px ${step.color}44`,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-paper)' }}>{step.label}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>{step.desc}</div>
                  </div>
                </div>
                {i < statusSteps.length - 1 && (
                  <ChevronRight size={20} color="var(--color-slate)" style={{ marginBottom: 20 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: 'var(--space-24) 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}>
            <p style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-coral)',
              marginBottom: 'var(--space-3)',
            }}>
              Why CampusFix?
            </p>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 800,
              color: 'var(--color-navy)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>
              From verbal complaint<br />to resolved issue.
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-6)',
          }}>
            {features.map((f, i) => (
              <div key={i} className="card card-padding" style={{
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform var(--transition-base)',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  background: 'var(--color-navy)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-lime)',
                  marginBottom: 'var(--space-4)',
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-lg)' }}>
                  {f.title}
                </h3>
                <p style={{ color: 'var(--color-slate-dark)', lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'var(--color-navy)',
        padding: 'var(--space-20) 0',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(201,240,107,0.06) 0%, transparent 70%)',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 900,
            color: 'var(--color-paper)',
            letterSpacing: '-0.02em',
            marginBottom: 'var(--space-4)',
          }}>
            See a problem on campus?
          </h2>
          <p style={{ color: 'rgba(245,242,233,0.7)', marginBottom: 'var(--space-8)', fontSize: 'var(--text-lg)' }}>
            Report it. Track it. Get it fixed.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Your Account
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--color-navy-800)',
        padding: 'var(--space-8) 0',
        borderTop: '1px solid var(--color-navy-700)',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 28, height: 28, background: 'var(--color-lime)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={14} color="var(--color-navy)" fill="var(--color-navy)" />
            </div>
            <span style={{ fontWeight: 700, color: 'var(--color-paper)', fontSize: 'var(--text-sm)' }}>CampusFix</span>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>
            Smart Campus Issue Tracker · Academic Project 2026
          </div>
          <a
            href="https://github.com/dhakshith414/campufix"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            GitHub Repository
            <ArrowRight size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
}
