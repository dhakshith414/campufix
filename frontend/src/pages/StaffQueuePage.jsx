import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge, PriorityBadge, IssueCode } from '../components/Badges';
import { PageLoading, ErrorMessage, EmptyState, Spinner } from '../components/UIStates';
import { FormModal } from '../components/Modal';
import { formatDistanceToNow } from '../utils/time';
import { Search, Filter, ChevronRight, ChevronLeft, ClipboardList, AlertCircle, X, Wrench } from 'lucide-react';

const STATUS_TRANSITIONS = {
  Submitted: ['Acknowledged', 'Rejected'],
  Acknowledged: ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Acknowledged'],
  Resolved: [],
  Rejected: [],
  Cancelled: [],
};

const STATUSES = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved'];

export default function StaffQueuePage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [issues, setIssues] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', myIssues: 'true' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Status Update Modal
  const [statusModal, setStatusModal] = useState({
    open: false,
    issue: null,
    status: '',
    resolutionNote: '',
    note: '',
    loading: false,
  });

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

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const clearFilters = () => {
    setFilters({ status: '', priority: '', myIssues: 'true' });
    setSearch('');
    setPage(1);
  };

  const openStatusModal = (e, issue) => {
    e.stopPropagation();
    setStatusModal({
      open: true,
      issue,
      status: '',
      resolutionNote: '',
      note: '',
      loading: false,
    });
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    const { issue, status, resolutionNote, note } = statusModal;
    if (!status) return;
    if (status === 'Resolved' && !resolutionNote.trim()) {
      toast.error('Resolution note is required when resolving an issue');
      return;
    }

    setStatusModal((prev) => ({ ...prev, loading: true }));
    try {
      await issuesAPI.updateStatus(issue._id, { status, resolutionNote, note });
      toast.success(`Progress recorded: Status changed to ${status}`);
      setStatusModal({ open: false, issue: null, status: '', resolutionNote: '', note: '', loading: false });
      fetchIssues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update progress');
      setStatusModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const hasActiveFilters = Boolean(search || filters.status || filters.priority || filters.myIssues !== 'true');

  return (
    <AppLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-navy)', color: 'var(--color-lime)', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Maintenance Staff Portal
            </div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
              Maintenance Work Queue
            </h1>
            <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
              Review assigned facilities, update work-in-progress, and log resolution notes
            </p>
          </div>
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
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ paddingLeft: 36 }}
              />
            </div>

            {/* My Issues toggle */}
            <button
              className={`btn btn-sm ${filters.myIssues === 'true' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => { setFilters({ ...filters, myIssues: filters.myIssues === 'true' ? '' : 'true' }); setPage(1); }}
            >
              {filters.myIssues === 'true' ? '✓ Showing My Assigned' : 'Show My Assigned Only'}
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
                <select className="form-select" value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
                  <option value="">All active statuses</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={filters.priority} onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}>
                  <option value="">All priorities</option>
                  {['Critical', 'High', 'Medium', 'Low'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {error && <ErrorMessage message={error} retry={fetchIssues} />}

        {loading ? (
          <PageLoading message="Loading work queue…" />
        ) : issues.length === 0 ? (
          <div className="card card-padding">
            <EmptyState
              icon={<ClipboardList size={40} />}
              title="Work queue is empty"
              description={
                hasActiveFilters
                  ? 'No issues match the selected filters.'
                  : filters.myIssues === 'true'
                  ? 'No issues currently assigned to you. Toggle "Show My Assigned Only" to browse all tickets.'
                  : 'No maintenance tickets pending action.'
              }
              action={
                hasActiveFilters ? (
                  <button className="btn btn-outline btn-sm" onClick={clearFilters}>Clear filters</button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Issue & Reference</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Reporter</th>
                    <th>Reported</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => {
                    const allowedTransitions = STATUS_TRANSITIONS[issue.status] || [];
                    const canProgress = allowedTransitions.length > 0;

                    return (
                      <tr
                        key={issue._id}
                        style={{ opacity: ['Resolved', 'Cancelled', 'Rejected'].includes(issue.status) ? 0.6 : 1 }}
                      >
                        <td>
                          <IssueCode code={issue.issueCode} />
                          <div
                            style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: 'var(--text-sm)', marginTop: 2, maxWidth: 220, cursor: 'pointer' }}
                            className="truncate"
                            onClick={() => navigate(`/issues/${issue._id}`)}
                            title="Click to view details"
                          >
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
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)' }}>{issue.reporter?.name || '—'}</td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>{formatDistanceToNow(issue.createdAt)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                            <button
                              onClick={() => navigate(`/issues/${issue._id}`)}
                              className="btn btn-ghost btn-xs"
                              title="View full report and history"
                              style={{ padding: '4px 8px' }}
                            >
                              Details
                            </button>
                            {canProgress && (
                              <button
                                onClick={(e) => openStatusModal(e, issue)}
                                className="btn btn-primary btn-xs"
                                title="Update progress / resolve issue"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                              >
                                <Wrench size={12} /> Update Progress
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-paper-200)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>
                  Page {pagination.page} of {pagination.pages} ({pagination.total} issues)
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    className="btn btn-outline btn-xs"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    className="btn btn-outline btn-xs"
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page >= pagination.pages || loading}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Update Progress Modal */}
      <FormModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, issue: null, status: '', resolutionNote: '', note: '', loading: false })}
        title={`Update Progress — ${statusModal.issue?.issueCode || 'Issue'}`}
      >
        <form onSubmit={handleStatusSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)', textTransform: 'uppercase', fontWeight: 600 }}>Issue Title</div>
              <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 'var(--text-base)', marginTop: 2 }}>{statusModal.issue?.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 4 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>Current state:</span>
                {statusModal.issue && <StatusBadge status={statusModal.issue.status} />}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Select Progress Transition</label>
              <select
                className="form-select"
                value={statusModal.status}
                onChange={(e) => setStatusModal({ ...statusModal, status: e.target.value })}
                required
              >
                <option value="">Select new status…</option>
                {statusModal.issue && (STATUS_TRANSITIONS[statusModal.issue.status] || []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {statusModal.status === 'Resolved' && (
              <div className="form-group">
                <label className="form-label required">Resolution Note</label>
                <textarea
                  className="form-textarea"
                  placeholder="Detail the work performed to fix this fault (e.g., replaced ballast, cleaned valve)…"
                  value={statusModal.resolutionNote}
                  onChange={(e) => setStatusModal({ ...statusModal, resolutionNote: e.target.value })}
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Activity Log Note (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Optional remark for timeline log…"
                value={statusModal.note}
                onChange={(e) => setStatusModal({ ...statusModal, note: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setStatusModal({ open: false, issue: null, status: '', resolutionNote: '', note: '', loading: false })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!statusModal.status || statusModal.loading}
              >
                {statusModal.loading ? <><Spinner size="sm" /> Updating…</> : 'Save Progress'}
              </button>
            </div>
          </div>
        </form>
      </FormModal>
    </AppLayout>
  );
}
