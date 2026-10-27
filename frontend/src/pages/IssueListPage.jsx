import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge, PriorityBadge, IssueCode } from '../components/Badges';
import { PageLoading, EmptyState, ErrorMessage } from '../components/UIStates';
import { Search, Plus, FileText, Filter, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { formatDistanceToNow } from '../utils/time';

const STATUSES = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Rejected', 'Cancelled'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const CATEGORIES = ['Electrical', 'Plumbing & Water', 'Cleaning & Sanitation', 'Classroom Equipment', 'Internet & Wi-Fi', 'Furniture & Infrastructure', 'Safety', 'Other'];

export default function IssueListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', category: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 15,
        sort: '-createdAt',
        ...(search && { search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.category && { category: filters.category }),
      };
      const res = await issuesAPI.list(params);
      setIssues(res.data.data.issues);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const clearFilters = () => {
    setFilters({ status: '', priority: '', category: '' });
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = search || filters.status || filters.priority || filters.category;

  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin';

  return (
    <AppLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
              {isStaffOrAdmin ? 'All Issues' : 'My Issues'}
            </h1>
            <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
              {pagination.total} {pagination.total === 1 ? 'issue' : 'issues'} found
            </p>
          </div>
          {user?.role === 'student' && (
            <Link to="/issues/new" className="btn btn-primary">
              <Plus size={16} />
              Report Issue
            </Link>
          )}
        </div>

        {/* Search & Filters */}
        <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate)' }} />
              <input
                type="text"
                className="form-input"
                placeholder={`Search issues${isStaffOrAdmin ? ' (title, code, location…)' : '…'}`}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ paddingLeft: 36 }}
              />
            </div>
            <button
              className={`btn ${showFilters ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              Filters
              {hasActiveFilters && <span style={{ background: 'var(--color-coral)', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>!</span>}
            </button>
            {hasActiveFilters && (
              <button className="btn btn-ghost" onClick={clearFilters}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-paper-200)' }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
                  <option value="">All statuses</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={filters.priority} onChange={e => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}>
                  <option value="">All priorities</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={filters.category} onChange={e => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}>
                  <option value="">All categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {error && <ErrorMessage message={error} retry={fetchIssues} />}

        {loading ? (
          <PageLoading message="Loading issues..." />
        ) : issues.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<FileText size={32} />}
              title={hasActiveFilters ? 'No matching issues' : (user?.role === 'student' ? 'No issues yet' : 'No issues found')}
              description={hasActiveFilters
                ? 'Try clearing your filters or broadening your search.'
                : user?.role === 'student'
                  ? 'You haven\'t submitted any issues yet. Report a problem on campus!'
                  : 'No issues are visible with the current filters.'}
              action={!hasActiveFilters && user?.role === 'student' ? (
                <Link to="/issues/new" className="btn btn-primary"><Plus size={16} />Report an Issue</Link>
              ) : hasActiveFilters ? (
                <button className="btn btn-outline" onClick={clearFilters}><X size={14} />Clear Filters</button>
              ) : null}
            />
          </div>
        ) : (
          <>
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
                      <th>Reported</th>
                      {isStaffOrAdmin && <th>Reporter</th>}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map(issue => (
                      <tr
                        key={issue._id}
                        className="table-clickable"
                        onClick={() => navigate(`/issues/${issue._id}`)}
                      >
                        <td>
                          <div>
                            <IssueCode code={issue.issueCode} />
                            <div style={{ fontWeight: 600, color: 'var(--color-navy)', marginTop: 4, maxWidth: 220 }} className="truncate">
                              {issue.title}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)' }}>{issue.category}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)' }} className="truncate">
                            {issue.location?.building}{issue.location?.room ? ` · ${issue.location.room}` : ''}
                          </span>
                        </td>
                        <td><PriorityBadge priority={issue.priority} /></td>
                        <td><StatusBadge status={issue.status} /></td>
                        <td>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>
                            {formatDistanceToNow(issue.createdAt)}
                          </span>
                        </td>
                        {isStaffOrAdmin && (
                          <td>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)' }}>
                              {issue.reporter?.name || '—'}
                            </span>
                          </td>
                        )}
                        <td>
                          <ChevronRight size={16} color="var(--color-slate)" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination" style={{ marginTop: 'var(--space-4)' }}>
                <button
                  className="page-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(7, pagination.pages) }, (_, i) => {
                  const p = i + Math.max(1, Math.min(page - 3, pagination.pages - 6));
                  return (
                    <button
                      key={p}
                      className={`page-btn ${p === page ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  className="page-btn"
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
