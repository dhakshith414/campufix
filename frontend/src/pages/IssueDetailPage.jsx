import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { issuesAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { PageLoading, ErrorMessage, Spinner } from '../components/UIStates';
import { ConfirmModal } from '../components/Modal';
import { formatDate, formatDistanceToNow } from '../utils/time';
import {
  ArrowLeft, MapPin, Tag, User, Calendar, CheckCircle,
  Clock, XCircle, RefreshCw, Edit2, Trash2
} from 'lucide-react';

const STATUS_TRANSITIONS = {
  Submitted: ['Acknowledged', 'Rejected'],
  Acknowledged: ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Acknowledged'],
  Resolved: [],
  Rejected: [],
  Cancelled: [],
};

const actionIcon = (action) => {
  const icons = {
    created: <Tag size={14} />,
    status_changed: <RefreshCw size={14} />,
    assigned: <User size={14} />,
    reassigned: <User size={14} />,
    unassigned: <User size={14} />,
    resolved: <CheckCircle size={14} />,
    rejected: <XCircle size={14} />,
    cancelled: <XCircle size={14} />,
    updated: <Edit2 size={14} />,
  };
  return icons[action] || <Clock size={14} />;
};

const actionLabel = (action, prev, next) => {
  const labels = {
    created: 'Issue submitted',
    status_changed: `Status changed: ${prev} → ${next}`,
    assigned: `Assigned to staff`,
    reassigned: `Reassigned`,
    unassigned: 'Assignment removed',
    resolved: 'Issue resolved',
    rejected: 'Issue rejected',
    cancelled: 'Issue cancelled',
    updated: 'Details updated',
  };
  return labels[action] || action;
};

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [issue, setIssue] = useState(null);
  const [activities, setActivities] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status update state
  const [statusForm, setStatusForm] = useState({ status: '', note: '', resolutionNote: '' });
  const [statusLoading, setStatusLoading] = useState(false);

  // Assignment state
  const [assigneeId, setAssigneeId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Cancel confirmation
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin';
  const isReporter = issue?.reporter?._id === user?.id;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issueRes, actRes] = await Promise.all([
        issuesAPI.getById(id),
        issuesAPI.getActivity(id),
      ]);
      setIssue(issueRes.data.data.issue);
      setActivities(actRes.data.data.activities);
      setAssigneeId(issueRes.data.data.issue.assignee?._id || '');

      if (isStaffOrAdmin) {
        const staffRes = await usersAPI.getStaff();
        setStaffList(staffRes.data.data.staff);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusForm.status) return;
    setStatusLoading(true);
    try {
      await issuesAPI.updateStatus(id, statusForm);
      toast.success(`Status updated to ${statusForm.status}`);
      setStatusForm({ status: '', note: '', resolutionNote: '' });
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAssign = async () => {
    setAssignLoading(true);
    try {
      await issuesAPI.updateAssignment(id, { assigneeId: assigneeId || null });
      toast.success(assigneeId ? 'Issue assigned' : 'Assignment removed');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update assignment');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCancel = async () => {
    setShowCancelConfirm(false);
    try {
      await issuesAPI.updateStatus(id, { status: 'Cancelled', note: 'Cancelled by reporter' });
      toast.success('Issue cancelled');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel issue');
    }
  };

  if (loading) return <AppLayout><PageLoading message="Loading issue details..." /></AppLayout>;
  if (error) return <AppLayout><ErrorMessage message={error} retry={fetchData} /></AppLayout>;
  if (!issue) return <AppLayout><div>Issue not found</div></AppLayout>;

  const allowedTransitions = STATUS_TRANSITIONS[issue.status] || [];
  const canEdit = isReporter && issue.status === 'Submitted';
  const canCancel = isReporter && issue.status === 'Submitted';

  return (
    <AppLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 'var(--space-6)', color: 'var(--color-slate)' }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="card card-padding" style={{ marginBottom: 'var(--space-4)', background: 'var(--color-navy)', color: 'var(--color-paper)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-lime)', fontWeight: 700, letterSpacing: '0.08em' }}>
                  {issue.issueCode}
                </span>
                <StatusBadge status={issue.status} />
                <PriorityBadge priority={issue.priority} />
              </div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-4)' }}>
                {issue.title}
              </h1>

              <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', fontSize: 'var(--text-sm)', color: 'rgba(245,242,233,0.7)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Tag size={14} color="var(--color-lime)" />
                  {issue.category}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <MapPin size={14} color="var(--color-lime)" />
                  {issue.location?.building}{issue.location?.room ? ` · ${issue.location.room}` : ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Calendar size={14} color="var(--color-lime)" />
                  {formatDistanceToNow(issue.createdAt)}
                </div>
              </div>
            </div>

            {/* Actions for reporter */}
            {(canEdit || canCancel) && (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {canEdit && (
                  <Link to={`/issues/${id}/edit`} className="btn btn-outline-light btn-sm">
                    <Edit2 size={14} /> Edit
                  </Link>
                )}
                {canCancel && (
                  <button onClick={() => setShowCancelConfirm(true)} className="btn btn-danger btn-sm">
                    <Trash2 size={14} /> Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-4)' }} className="issue-detail-grid">
          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Description */}
            <div className="card card-padding">
              <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Description</h2>
              <p style={{ color: 'var(--color-navy)', lineHeight: 1.8, fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap' }}>
                {issue.description}
              </p>
              {issue.location?.additionalDetail && (
                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-paper)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-slate-dark)' }}>
                  <strong>Additional detail:</strong> {issue.location.additionalDetail}
                </div>
              )}
            </div>

            {/* Resolution note */}
            {issue.resolutionNote && (
              <div className="card card-padding" style={{ borderLeft: '4px solid var(--color-success)' }}>
                <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <CheckCircle size={16} color="var(--color-success)" />
                  Resolution Note
                </h2>
                <p style={{ color: 'var(--color-navy)', lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>
                  {issue.resolutionNote}
                </p>
                {issue.resolvedAt && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)', marginTop: 'var(--space-3)' }}>
                    Resolved on {formatDate(issue.resolvedAt)}
                  </p>
                )}
              </div>
            )}

            {/* Staff status update form */}
            {isStaffOrAdmin && allowedTransitions.length > 0 && (
              <div className="card card-padding">
                <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
                  Update Status
                </h2>
                <form onSubmit={handleStatusUpdate}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label required">New status</label>
                      <select
                        className="form-select"
                        value={statusForm.status}
                        onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                        required
                      >
                        <option value="">Select new status…</option>
                        {allowedTransitions.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {statusForm.status === 'Resolved' && (
                      <div className="form-group">
                        <label className="form-label required">Resolution note</label>
                        <textarea
                          className="form-textarea"
                          placeholder="Describe what was done to resolve this issue…"
                          value={statusForm.resolutionNote}
                          onChange={e => setStatusForm({ ...statusForm, resolutionNote: e.target.value })}
                          rows={3}
                          required
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Note (optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Add a note about this status change…"
                        value={statusForm.note}
                        onChange={e => setStatusForm({ ...statusForm, note: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!statusForm.status || statusLoading}
                    >
                      {statusLoading ? <><Spinner size="sm" /> Updating…</> : 'Update Status'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="card card-padding">
              <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-base)' }}>
                Activity Timeline
              </h2>
              {activities.length === 0 ? (
                <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)' }}>No activity recorded yet.</p>
              ) : (
                <div className="timeline">
                  {activities.map((act, i) => (
                    <div key={act._id} className="timeline-item">
                      <div className="timeline-icon" style={{ background: i === activities.length - 1 ? 'var(--color-lime)' : 'var(--color-paper-200)', color: i === activities.length - 1 ? 'var(--color-navy)' : 'var(--color-slate)' }}>
                        {actionIcon(act.action)}
                      </div>
                      <div className="timeline-content">
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}>
                          {actionLabel(act.action, act.previousValue, act.newValue)}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)', marginTop: 2 }}>
                          by {act.actor?.name} ({act.actor?.role}) · {formatDate(act.createdAt)}
                        </div>
                        {act.note && (
                          <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-paper)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)', fontStyle: 'italic' }}>
                            "{act.note}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — meta & assignment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Meta card */}
            <div className="card card-padding">
              <h3 style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--color-navy)', marginBottom: 'var(--space-4)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Issue Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { label: 'Reference', value: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{issue.issueCode}</span> },
                  { label: 'Status', value: <StatusBadge status={issue.status} /> },
                  { label: 'Priority', value: <PriorityBadge priority={issue.priority} /> },
                  { label: 'Category', value: issue.category },
                  { label: 'Location', value: `${issue.location?.building}${issue.location?.room ? ` · ${issue.location.room}` : ''}` },
                  { label: 'Reporter', value: issue.reporter?.name },
                  { label: 'Submitted', value: formatDate(issue.createdAt) },
                  { label: 'Last updated', value: formatDate(issue.updatedAt) },
                  ...(issue.resolvedAt ? [{ label: 'Resolved', value: formatDate(issue.resolvedAt) }] : []),
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-slate)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignment card — staff/admin only */}
            {isStaffOrAdmin && (
              <div className="card card-padding">
                <h3 style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--color-navy)', marginBottom: 'var(--space-4)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Assignment
                </h3>
                {issue.assignee ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-navy)' }}>
                      {issue.assignee.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{issue.assignee.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>{issue.assignee.role}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>Unassigned</div>
                )}

                {!['Resolved', 'Rejected', 'Cancelled'].includes(issue.status) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <select
                      className="form-select"
                      value={assigneeId}
                      onChange={e => setAssigneeId(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {staffList.map(s => (
                        <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      className="btn btn-secondary btn-sm"
                      disabled={assignLoading}
                    >
                      {assignLoading ? <Spinner size="sm" variant="white" /> : 'Update Assignment'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Cancel Issue"
        message="Are you sure you want to cancel this issue? This action cannot be undone."
        confirmText="Yes, Cancel Issue"
        confirmVariant="danger"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <style>{`
        @media (max-width: 768px) {
          .issue-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppLayout>
  );
}
