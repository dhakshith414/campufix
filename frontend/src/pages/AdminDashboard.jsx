import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardAPI, issuesAPI, usersAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge, PriorityBadge, IssueCode } from '../components/Badges';
import { PageLoading, ErrorMessage, EmptyState, Spinner } from '../components/UIStates';
import { FormModal } from '../components/Modal';
import { formatDistanceToNow } from '../utils/time';
import {
  BarChart2, AlertCircle, CheckCircle, Clock, Users,
  TrendingUp, AlertTriangle, ChevronRight, RefreshCw,
  Search, Filter, X, ChevronLeft, UserCheck
} from 'lucide-react';

const STATUS_TRANSITIONS = {
  Submitted: ['Acknowledged', 'Rejected', 'Cancelled'],
  Acknowledged: ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Acknowledged'],
  Resolved: [],
  Rejected: [],
  Cancelled: [],
};

const STATUSES = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Rejected', 'Cancelled'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const CATEGORIES = [
  'Electrical',
  'Plumbing & Water',
  'Cleaning & Sanitation',
  'Classroom Equipment',
  'Internet & Wi-Fi',
  'Furniture & Infrastructure',
  'Safety',
  'Other',
];

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
  const toast = useToast();

  const [summary, setSummary] = useState(null);
  const [issues, setIssues] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters for Reports List
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', category: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Staff members for assignment dropdown
  const [staffList, setStaffList] = useState([]);

  // Assignment Modal
  const [assignModal, setAssignModal] = useState({ open: false, issue: null, assigneeId: '', note: '', loading: false });

  // Status Update Modal
  const [statusModal, setStatusModal] = useState({
    open: false,
    issue: null,
    status: '',
    resolutionNote: '',
    note: '',
    loading: false,
  });

  const fetchSummary = useCallback(async () => {
    try {
      const res = await dashboardAPI.getSummary();
      setSummary(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard statistics');
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      setIssuesLoading(true);
      const params = {
        page,
        limit: 10,
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
      toast.error(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setIssuesLoading(false);
    }
  }, [page, search, filters, toast]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await usersAPI.getStaff();
      setStaffList(res.data.data.staff || []);
    } catch {
      // Non-critical if staff list fails
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    await Promise.all([fetchSummary(), fetchReports(), fetchStaff()]);
    setLoading(false);
  }, [fetchSummary, fetchReports, fetchStaff]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // When filters or search change, refetch reports
  useEffect(() => {
    if (!loading) {
      fetchReports();
    }
  }, [page, search, filters, fetchReports, loading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSummary(), fetchReports()]);
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '', category: '' });
    setSearch('');
    setPage(1);
  };

  // Open Assignment Modal
  const openAssignModal = (e, issue) => {
    e.stopPropagation();
    setAssignModal({
      open: true,
      issue,
      assigneeId: issue.assignee?._id || '',
      note: '',
      loading: false,
    });
  };

  // Submit Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    const { issue, assigneeId, note } = assignModal;
    setAssignModal((prev) => ({ ...prev, loading: true }));
    try {
      await issuesAPI.updateAssignment(issue._id, { assigneeId: assigneeId || null, note });
      toast.success('Technician assignment updated');
      setAssignModal({ open: false, issue: null, assigneeId: '', note: '', loading: false });
      await Promise.all([fetchReports(), fetchSummary()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update assignment');
      setAssignModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Open Status Modal
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

  // Submit Status Change
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
      toast.success(`Status updated to ${status}`);
      setStatusModal({ open: false, issue: null, status: '', resolutionNote: '', note: '', loading: false });
      await Promise.all([fetchReports(), fetchSummary()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
      setStatusModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const hasActiveFilters = Boolean(search || filters.status || filters.priority || filters.category);

  if (loading) return <AppLayout><PageLoading message="Loading executive dashboard..." /></AppLayout>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-navy)', color: 'var(--color-lime)', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Administrator Portal
            </div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
              Operations & Facility Dashboard
            </h1>
            <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
              Live campus-wide incident analytics, maintenance assignment, and resolution control
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button onClick={handleRefresh} className="btn btn-outline btn-sm" disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              Refresh
            </button>
            <Link to="/admin/users" className="btn btn-secondary btn-sm">
              <Users size={14} /> Manage Users
            </Link>
          </div>
        </div>

        {error && <ErrorMessage message={error} retry={loadAll} />}

        {summary && (
          <>
            {/* Real Counts KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
              <StatCard icon={<BarChart2 size={22} />} value={summary.total} label="Total Reports" color="var(--color-navy)" accent="var(--color-navy)" />
              <StatCard icon={<Clock size={22} />} value={summary.byStatus?.Submitted ?? 0} label="Submitted" color="#8b5cf6" accent="#8b5cf6" />
              <StatCard icon={<TrendingUp size={22} />} value={summary.byStatus?.['In Progress'] ?? 0} label="In Progress" color="#3b82f6" accent="#3b82f6" />
              <StatCard icon={<CheckCircle size={22} />} value={summary.byStatus?.Resolved ?? 0} label="Resolved" color="var(--color-success)" accent="var(--color-success)" />
              <StatCard icon={<AlertTriangle size={22} />} value={summary.byPriority?.Critical ?? 0} label="Critical Issues" color="var(--color-coral)" accent="var(--color-coral)" sublabel={summary.byPriority?.Critical > 0 ? 'Urgent' : null} />
              <StatCard icon={<AlertCircle size={22} />} value={summary.unassigned ?? 0} label="Unassigned" color="var(--color-amber)" accent="var(--color-amber)" />
              <StatCard icon={<Clock size={22} />} value={summary.overdue ?? 0} label="Overdue (7d+)" color="var(--color-coral)" accent="var(--color-coral-dark)" />
            </div>

            {/* Breakdown Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
              {/* Status Breakdown */}
              <div className="card card-padding">
                <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-5)', fontSize: 'var(--text-base)' }}>
                  Lifecycle Status Distribution
                </h2>
                {Object.entries(summary.byStatus || {}).map(([status, count]) => {
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
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-navy)' }}>{count} ({pct}%)</span>
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

              {/* Category Breakdown */}
              <div className="card card-padding">
                <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-5)', fontSize: 'var(--text-base)' }}>
                  Top Fault Categories
                </h2>
                {summary.byCategory?.length === 0 ? (
                  <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)' }}>No categorical data recorded yet.</p>
                ) : (
                  summary.byCategory?.slice(0, 6).map(({ category, count }) => (
                    <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-paper-200)' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}>{category}</span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-navy)', background: 'var(--color-paper-200)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                        {count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* All Reports & Operations Management Table */}
        {/* ============================================================ */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-paper-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div>
                <h2 style={{ fontWeight: 800, color: 'var(--color-navy)', fontSize: 'var(--text-xl)', letterSpacing: '-0.01em' }}>
                  All Campus Reports & Triage
                </h2>
                <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-xs)', marginTop: 2 }}>
                  Search, filter, assign maintenance staff, or advance report lifecycle directly
                </p>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)', fontWeight: 600 }}>
                {pagination.total} total incident{pagination.total !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by title, ticket code, building, room…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  style={{ paddingLeft: 36 }}
                />
              </div>

              <button
                className={`btn btn-sm ${showFilters ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={14} /> Filter Options
              </button>

              {hasActiveFilters && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                  <X size={14} /> Reset Filters
                </button>
              )}
            </div>

            {/* Filter Dropdowns Panel */}
            {showFilters && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-paper-200)' }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
                  >
                    <option value="">All Statuses</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={filters.priority}
                    onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}
                  >
                    <option value="">All Priorities</option>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={filters.category}
                    onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Reports Table */}
          {issuesLoading ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <Spinner size="lg" />
              <p style={{ color: 'var(--color-slate)', marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>Loading reports…</p>
            </div>
          ) : issues.length === 0 ? (
            <div style={{ padding: 'var(--space-8)' }}>
              <EmptyState
                title="No reports found"
                description={hasActiveFilters ? 'No reports matched your search or filters.' : 'No maintenance reports filed yet.'}
                action={hasActiveFilters ? <button className="btn btn-outline btn-sm" onClick={clearFilters}>Clear Filters</button> : null}
              />
            </div>
          ) : (
            <>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Ticket & Issue</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assignee</th>
                      <th>Reported</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue) => {
                      const allowedTransitions = STATUS_TRANSITIONS[issue.status] || [];
                      const canUpdateStatus = allowedTransitions.length > 0;
                      const canAssign = !['Resolved', 'Rejected', 'Cancelled'].includes(issue.status);

                      return (
                        <tr key={issue._id} style={{ opacity: ['Resolved', 'Cancelled', 'Rejected'].includes(issue.status) ? 0.7 : 1 }}>
                          <td>
                            <IssueCode code={issue.issueCode} />
                            <div
                              style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-navy)', marginTop: 2, maxWidth: 220, cursor: 'pointer' }}
                              className="truncate"
                              onClick={() => navigate(`/issues/${issue._id}`)}
                              title="Click to view full ticket details"
                            >
                              {issue.title}
                            </div>
                            {issue.reporter?.name && (
                              <div style={{ fontSize: '11px', color: 'var(--color-slate)', marginTop: 2 }}>
                                By: {issue.reporter.name}
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)' }}>{issue.category}</td>
                          <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)' }}>
                            {issue.location?.building}{issue.location?.room ? ` · ${issue.location.room}` : ''}
                          </td>
                          <td><PriorityBadge priority={issue.priority} /></td>
                          <td><StatusBadge status={issue.status} /></td>
                          <td style={{ fontSize: 'var(--text-xs)' }}>
                            {issue.assignee?.name ? (
                              <span style={{ fontWeight: 600, color: 'var(--color-navy)' }}>{issue.assignee.name}</span>
                            ) : (
                              <span style={{ color: 'var(--color-coral)', fontWeight: 600 }}>Unassigned</span>
                            )}
                          </td>
                          <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>{formatDistanceToNow(issue.createdAt)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                              <button
                                onClick={() => navigate(`/issues/${issue._id}`)}
                                className="btn btn-ghost btn-xs"
                                title="View details and audit timeline"
                                style={{ padding: '4px 8px' }}
                              >
                                View
                              </button>

                              {canAssign && (
                                <button
                                  onClick={(e) => openAssignModal(e, issue)}
                                  className="btn btn-outline btn-xs"
                                  title="Assign staff technician"
                                  style={{ padding: '4px 8px', fontSize: '11px' }}
                                >
                                  <UserCheck size={12} /> Assign
                                </button>
                              )}

                              {canUpdateStatus && (
                                <button
                                  onClick={(e) => openStatusModal(e, issue)}
                                  className="btn btn-secondary btn-xs"
                                  title="Advance status"
                                  style={{ padding: '4px 8px', fontSize: '11px' }}
                                >
                                  Status
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

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-paper-200)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>
                    Page {pagination.page} of {pagination.pages} ({pagination.total} reports)
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || issuesLoading}
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page >= pagination.pages || issuesLoading}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Assign Staff Modal */}
      {/* ============================================================ */}
      <FormModal
        isOpen={assignModal.open}
        onClose={() => setAssignModal({ open: false, issue: null, assigneeId: '', note: '', loading: false })}
        title={`Assign Staff — ${assignModal.issue?.issueCode || 'Issue'}`}
      >
        <form onSubmit={handleAssignSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)', textTransform: 'uppercase', fontWeight: 600 }}>Report Title</div>
              <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 'var(--text-base)', marginTop: 2 }}>{assignModal.issue?.title}</div>
            </div>

            <div className="form-group">
              <label className="form-label required">Select Maintenance Staff</label>
              <select
                className="form-select"
                value={assignModal.assigneeId}
                onChange={(e) => setAssignModal({ ...assignModal, assigneeId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.department || s.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assignment Note (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Assigned to Electrical team for immediate inspection"
                value={assignModal.note}
                onChange={(e) => setAssignModal({ ...assignModal, note: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setAssignModal({ open: false, issue: null, assigneeId: '', note: '', loading: false })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={assignModal.loading}
              >
                {assignModal.loading ? <><Spinner size="sm" /> Saving…</> : 'Save Assignment'}
              </button>
            </div>
          </div>
        </form>
      </FormModal>

      {/* ============================================================ */}
      {/* Update Status Modal */}
      {/* ============================================================ */}
      <FormModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, issue: null, status: '', resolutionNote: '', note: '', loading: false })}
        title={`Update Status — ${statusModal.issue?.issueCode || 'Issue'}`}
      >
        <form onSubmit={handleStatusSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)', textTransform: 'uppercase', fontWeight: 600 }}>Current Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 4 }}>
                {statusModal.issue && <StatusBadge status={statusModal.issue.status} />}
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>({statusModal.issue?.title})</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Select New Status</label>
              <select
                className="form-select"
                value={statusModal.status}
                onChange={(e) => setStatusModal({ ...statusModal, status: e.target.value })}
                required
              >
                <option value="">Select next status transition…</option>
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
                  placeholder="Detail the repairs completed or parts replaced (required to close ticket)…"
                  value={statusModal.resolutionNote}
                  onChange={(e) => setStatusModal({ ...statusModal, resolutionNote: e.target.value })}
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Audit Note (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Optional explanation for audit activity log…"
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
                {statusModal.loading ? <><Spinner size="sm" /> Updating…</> : 'Confirm Status Change'}
              </button>
            </div>
          </div>
        </form>
      </FormModal>

      <style>{`.spin { animation: spin 1s linear infinite; }`}</style>
    </AppLayout>
  );
}
