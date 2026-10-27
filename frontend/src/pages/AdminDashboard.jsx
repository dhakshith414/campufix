import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardAPI, issuesAPI } from '../services/api';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge, PriorityBadge, IssueCode } from '../components/Badges';
import { PageLoading, ErrorMessage } from '../components/UIStates';
import { formatDistanceToNow } from '../utils/time';
import {
  BarChart2, AlertCircle, CheckCircle, Clock, Users,
  TrendingUp, AlertTriangle, ChevronRight, RefreshCw
} from 'lucide-react';

const StatCard = ({ icon, value, label, color, accent, sublabel }) => (
  <div className="stat-card">
    <div className="stat-card-accent" style={{ background: accent }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
      <div style={{ color, width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      {sublabel && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-coral)', fontWeight: 600, background: 'var(--color-error-bg)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
          {sublabel}
        </span>
      )}
    </div>
    <div className="stat-value">{value ?? '—'}</div>
    <div className="stat-label">{label}</div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [dashRes, issuesRes] = await Promise.all([
        dashboardAPI.getSummary(),
        issuesAPI.list({ limit: 8, sort: '-createdAt', status: '' }),
      ]);
      setSummary(dashRes.data.data);
      setRecentIssues(issuesRes.data.data.issues);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  if (loading) return <AppLayout><PageLoading message="Loading admin dashboard..." /></AppLayout>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
              Operations Dashboard
            </h1>
            <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
              Live campus maintenance overview · All statistics from database
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button onClick={handleRefresh} className="btn btn-outline btn-sm" disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              Refresh
            </button>
            <Link to="/issues" className="btn btn-secondary btn-sm">View All Issues</Link>
            <Link to="/admin/users" className="btn btn-secondary btn-sm">
              <Users size={14} /> Manage Users
            </Link>
          </div>
        </div>

        {error && <ErrorMessage message={error} retry={fetchData} />}

        {summary && (
          <>
            {/* Primary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
              <StatCard icon={<BarChart2 size={22} />} value={summary.total} label="Total Issues" color="var(--color-navy)" accent="var(--color-navy)" />
              <StatCard icon={<Clock size={22} />} value={summary.byStatus?.Submitted} label="Awaiting Review" color="#8b5cf6" accent="#8b5cf6" />
              <StatCard icon={<TrendingUp size={22} />} value={summary.byStatus?.['In Progress']} label="In Progress" color="#3b82f6" accent="#3b82f6" />
              <StatCard icon={<CheckCircle size={22} />} value={summary.byStatus?.Resolved} label="Resolved" color="var(--color-success)" accent="var(--color-success)" />
              <StatCard icon={<AlertCircle size={22} />} value={summary.unassigned} label="Unassigned" color="var(--color-amber)" accent="var(--color-amber)" sublabel="Action needed" />
              <StatCard icon={<AlertTriangle size={22} />} value={summary.byPriority?.Critical} label="Critical Priority" color="var(--color-coral)" accent="var(--color-coral)" />
              <StatCard icon={<Clock size={22} />} value={summary.overdue} label="Overdue (7d+)" color="var(--color-coral)" accent="var(--color-coral-dark)" />
            </div>

            {/* Secondary stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              {/* Status breakdown */}
              <div className="card card-padding">
                <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-5)', fontSize: 'var(--text-base)' }}>Status Breakdown</h2>
                {Object.entries(summary.byStatus).map(([status, count]) => {
                  const total = summary.total || 1;
                  const pct = Math.round((count / total) * 100);
                  const colors = {
                    Submitted: '#8b5cf6',
                    Acknowledged: 'var(--color-amber)',
                    'In Progress': '#3b82f6',
                    Resolved: 'var(--color-success)',
                    Rejected: 'var(--color-coral)',
                    Cancelled: 'var(--color-slate)',
                  };
                  return (
                    <div key={status} style={{ marginBottom: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-navy)' }}>{status}</span>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-navy)' }}>{count}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--color-paper-200)' }}>
                        <div style={{
                          height: '100%',
                          borderRadius: 3,
                          width: `${pct}%`,
                          background: colors[status] || 'var(--color-slate)',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Category breakdown */}
              <div className="card card-padding">
                <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-5)', fontSize: 'var(--text-base)' }}>Top Categories</h2>
                {summary.byCategory?.length === 0 ? (
                  <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)' }}>No data yet.</p>
                ) : (
                  summary.byCategory?.slice(0, 6).map(({ category, count }) => (
                    <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-paper-200)' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}>{category}</span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-navy)', background: 'var(--color-paper)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                        {count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Recent issues table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-paper-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 'var(--text-lg)' }}>Recent Issues</h2>
            <Link to="/issues" className="btn btn-ghost btn-sm" style={{ color: 'var(--color-navy)' }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Reported</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentIssues.map(issue => (
                  <tr key={issue._id} className="table-clickable" onClick={() => navigate(`/issues/${issue._id}`)}>
                    <td>
                      <IssueCode code={issue.issueCode} />
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-navy)', marginTop: 2, maxWidth: 240 }} className="truncate">
                        {issue.title}
                      </div>
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)' }}>{issue.category}</td>
                    <td><PriorityBadge priority={issue.priority} /></td>
                    <td><StatusBadge status={issue.status} /></td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)' }}>
                      {issue.assignee?.name || <span style={{ color: 'var(--color-coral)', fontWeight: 600 }}>Unassigned</span>}
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>{formatDistanceToNow(issue.createdAt)}</td>
                    <td><ChevronRight size={16} color="var(--color-slate)" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; }`}</style>
    </AppLayout>
  );
}
