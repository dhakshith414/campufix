import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  LayoutDashboard, FileText, Plus, Users,
  LogOut, ChevronRight, Zap, ClipboardList, BarChart3, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const CampusFixLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
    <div style={{
      width: 36,
      height: 36,
      background: 'var(--color-lime)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Zap size={20} color="var(--color-navy)" fill="var(--color-navy)" />
    </div>
    <div>
      <div style={{
        fontWeight: 800,
        fontSize: 'var(--text-lg)',
        color: 'var(--color-paper)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        Campus<span style={{ color: 'var(--color-lime)' }}>Fix</span>
      </div>
      <div style={{ fontSize: '10px', color: 'var(--color-slate)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
        Issue Tracker
      </div>
    </div>
  </div>
);

const navItems = {
  student: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/issues/new', icon: Plus, label: 'Report Issue' },
    { to: '/issues', icon: FileText, label: 'My Issues' },
  ],
  staff: [
    { to: '/staff', icon: ClipboardList, label: 'Work Queue' },
    { to: '/issues', icon: FileText, label: 'All Issues' },
  ],
  admin: [
    { to: '/admin', icon: BarChart3, label: 'Dashboard' },
    { to: '/issues', icon: FileText, label: 'All Issues' },
    { to: '/admin/users', icon: Users, label: 'Users' },
  ],
};

const Sidebar = ({ mobileOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();

  const items = navItems[user?.role] || navItems.student;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={onClose}
        />
      )}

      <aside style={{
        width: 'var(--sidebar-width)',
        background: 'var(--color-navy)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 50,
        transition: 'transform var(--transition-base)',
        transform: mobileOpen ? 'translateX(0)' : undefined,
        // On mobile, hide by default
        ...(!mobileOpen ? { ['@media (max-width: 768px)']: { transform: 'translateX(-100%)' } } : {}),
      }} className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-navy-700)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/dashboard'}>
              <CampusFixLogo />
            </Link>
            <button onClick={onClose} className="btn btn-ghost btn-sm show-mobile-only" style={{ color: 'var(--color-slate)' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-navy-700)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3)',
            background: 'var(--color-navy-800)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-lime)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--color-navy)',
              flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-paper)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-lime)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                {user?.role}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: 'var(--space-4) var(--space-3)', overflowY: 'auto' }}>
          <div style={{ marginBottom: 'var(--space-2)', padding: '0 var(--space-3)', fontSize: '10px', fontWeight: 600, color: 'var(--color-slate)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Navigation
          </div>
          {items.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || (to !== '/dashboard' && to !== '/staff' && to !== '/admin' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={18} />
                {label}
                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.7 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: 'var(--space-4) var(--space-3)', borderTop: '1px solid var(--color-navy-700)' }}>
          <button onClick={handleLogout} className="nav-link w-full" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};

export const AppLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar — hidden on mobile unless toggled */}
      <div className="hide-mobile">
        <Sidebar mobileOpen={false} onClose={() => {}} />
      </div>
      <div className="show-mobile-only">
        <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        marginLeft: 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--color-paper)',
        display: 'flex',
        flexDirection: 'column',
      }} className="app-main">
        {/* Mobile header */}
        <header className="show-mobile-only" style={{
          height: 'var(--header-height)',
          background: 'var(--color-navy)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-4)',
          gap: 'var(--space-4)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <button onClick={() => setMobileMenuOpen(true)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-paper)' }}>
            <Menu size={22} />
          </button>
          <CampusFixLogo />
        </header>

        <main style={{ flex: 1, padding: 'var(--space-8)', maxWidth: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

// Inject responsive CSS for sidebar
const sidebarStyle = document.createElement('style');
sidebarStyle.textContent = `
  @media (max-width: 768px) {
    .app-main { margin-left: 0 !important; }
    .sidebar { transform: translateX(-100%); }
    .sidebar.sidebar-open { transform: translateX(0); }
  }
`;
document.head.appendChild(sidebarStyle);

export { CampusFixLogo };
