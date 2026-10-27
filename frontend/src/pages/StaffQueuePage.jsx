import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge, PriorityBadge, IssueCode } from '../components/Badges';
import { PageLoading, ErrorMessage, EmptyState } from '../components/UIStates';
import { formatDistanceToNow } from '../utils/time';
import { Search, Filter, ChevronRight, ClipboardList, AlertCircle, X } from 'lucide-react';

const STATUSES = ['Submitted', 'Acknowledged', 'In Progress'];

export default function StaffQueuePage() {
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', myIssues: 'true' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 20,
        sort: '-createdAt',
        ...(search && { search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.myIssues && { myIssues: filters.myIssues }),
      };
      const res = await issuesAPI.list(params);
      setIssues(res.data.data.issues);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load work queue');
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const clearFilters = () => {
    setFilters({ status: '', priority: '', myIssues: 'true' });
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = search || filters.status || filters.priority || filters.myIssues !== 'true';

  return (
    <AppLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
            Work Queue
          </h1>
          <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {pagination.total} issue{pagination.total !== 1 ? 's' : ''} matching your filters
          </p>
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by title, code, location…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ paddingLeft: 36 }}
              />
            </div>

            {/* My Issues toggle */}
            <button
              className={`btn btn-sm ${filters.myIssues === 'true' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => { setFilters({ ...filters, myIssues: filters.myIssues === 'true' ? '' : 'true' }); setPage(1); }}
            >
              My Assigned Issues
            </button>

            <button
              className={`btn btn-sm ${showFilters ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={14} /> Filters
            </button>

            {hasActiveFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-paper-200)' }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
                  <option value="">All active</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={filters.priority} onChange={e => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}>
                  <option value="">All</option>
                  {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {error && <ErrorMessage message={error} retry={fetchIssues} />}

        {loading ? (
          <PageLoading message="Loading work queue..." />
        ) : issues.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<ClipboardList size={32} />}
              title="No issues in queue"
              description={hasActiveFilters ? 'No issues match your filters.' : 'No issues assigned to you yet.'}
              action={hasActiveFilters ? <button className="btn btn-outline" onClick={clearFilters}><X size={14} /> Clear filters</button> : null}
            />
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Reporter</th>
                    <th>Age</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map(issue => (
                    <tr
                      key={issue._id}
                      className="table-clickable"
                      onClick={() => navigate(`/issues/${issue._id}`)}
                      style={{ opacity: ['Resolved', 'Cancelled', 'Rejected'].includes(issue.status) ? 0.6 : 1 }}
                    >
                      <td>
                        <IssueCode code={issue.issueCode} />
                        <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: 'var(--text-sm)', marginTop: 2, maxWidth: 220 }} className="truncate">
                          {issue.title}
                        </div>
                        {!issue.assignee && !['Resolved', 'Cancelled', 'Rejected'].includes(issue.status) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, fontSize: '10px', color: 'var(--color-coral)', fontWeight: 600 }}>
                            <AlertCircle size={10} /> Unassigned
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)' }}>{issue.category}</td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)' }}>
                        {issue.location?.building}{issue.location?.room ? ` · ${issue.location.room}` : ''}
                      </td>
                      <td><PriorityBadge priority={issue.priority} /></td>
                      <td><StatusBadge status={issue.status} /></td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)' }}>{issue.reporter?.name}</td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>{formatDistanceToNow(issue.createdAt)}</td>
                      <td><ChevronRight size={16} color="var(--color-slate)" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
