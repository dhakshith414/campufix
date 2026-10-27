import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { issuesAPI } from '../services/api';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge, PriorityBadge, IssueCode } from '../components/Badges';
import { PageLoading, EmptyState, ErrorMessage } from '../components/UIStates';
import { Plus, FileText, CheckCircle, Clock, AlertCircle, ChevronRight, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from '../utils/time';

const StatCard = ({ icon, value, label, color, accent }) => (
  <div className="stat-card">
    <div className="stat-card-accent" style={{ background: accent }} />
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
      <div style={{ color, width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

export default function StudentDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await issuesAPI.list({ limit: 5, sort: '-createdAt' });
      setIssues(res.data.data.issues);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, []);

  const counts = {
    total: issues.length,
    open: issues.filter(i => !['Resolved', 'Cancelled', 'Rejected'].includes(i.status)).length,
    resolved: issues.filter(i => i.status === 'Resolved').length,
    critical: issues.filter(i => i.priority === 'Critical').length,
  };

  if (loading) return <AppLayout><PageLoading message="Loading your dashboard..." /></AppLayout>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em', marginBottom: 'var(--space-1)' }}>
              Hello, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)' }}>
              Here's an overview of your campus issue reports.
            </p>
          </div>
          <Link to="/issues/new" className="btn btn-primary">
            <Plus size={16} />
            Report New Issue
          </Link>
        </div>

        {error && <ErrorMessage message={error} retry={fetchIssues} />}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <StatCard icon={<FileText size={20} />} value={counts.total} label="Total Reports" color="var(--color-navy)" accent="var(--color-navy)" />
          <StatCard icon={<Clock size={20} />} value={counts.open} label="Open Issues" color="#8b5cf6" accent="#8b5cf6" />
          <StatCard icon={<CheckCircle size={20} />} value={counts.resolved} label="Resolved" color="var(--color-success)" accent="var(--color-success)" />
          <StatCard icon={<AlertCircle size={20} />} value={counts.critical} label="Critical" color="var(--color-coral)" accent="var(--color-coral)" />
        </div>

        {/* Recent Issues */}
        <div className="card">
          <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-paper-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 'var(--text-lg)' }}>Recent Reports</h2>
              <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-xs)', marginTop: 2 }}>Your latest 5 submissions</p>
            </div>
            <Link to="/issues" className="btn btn-ghost btn-sm" style={{ color: 'var(--color-navy)' }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {issues.length === 0 ? (
            <EmptyState
              icon={<FileText size={32} />}
              title="No issues yet"
              description="You haven't reported any campus issues. Use the button above to submit your first report."
              action={
                <Link to="/issues/new" className="btn btn-primary">
                  <Plus size={16} />
                  Report an Issue
                </Link>
              }
            />
          ) : (
            <div>
              {issues.map((issue) => (
                <Link
                  key={issue._id}
                  to={`/issues/${issue._id}`}
                  style={{ display: 'block', textDecoration: 'none', borderBottom: '1px solid var(--color-paper-200)' }}
                >
                  <div style={{ padding: 'var(--space-4) var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-paper)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 4, flexWrap: 'wrap' }}>
                        <IssueCode code={issue.issueCode} />
                        <StatusBadge status={issue.status} />
                        <PriorityBadge priority={issue.priority} />
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {issue.title}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)', marginTop: 2 }}>
                        {issue.location?.building}{issue.location?.room ? ` · ${issue.location.room}` : ''} · {formatDistanceToNow(issue.createdAt)}
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--color-slate)" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <Link to="/issues/new" style={{ textDecoration: 'none' }}>
            <div className="card card-padding" style={{ cursor: 'pointer', textAlign: 'center', transition: 'transform var(--transition-base)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
              <Plus size={24} color="var(--color-navy)" style={{ margin: '0 auto var(--space-3)' }} />
              <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: 'var(--text-sm)' }}>Report New Issue</div>
              <div style={{ color: 'var(--color-slate)', fontSize: 'var(--text-xs)', marginTop: 4 }}>Takes under a minute</div>
            </div>
          </Link>
          <Link to="/issues" style={{ textDecoration: 'none' }}>
            <div className="card card-padding" style={{ cursor: 'pointer', textAlign: 'center', transition: 'transform var(--transition-base)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
              <TrendingUp size={24} color="var(--color-navy)" style={{ margin: '0 auto var(--space-3)' }} />
              <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: 'var(--text-sm)' }}>Track My Issues</div>
              <div style={{ color: 'var(--color-slate)', fontSize: 'var(--text-xs)', marginTop: 4 }}>View full history & details</div>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
