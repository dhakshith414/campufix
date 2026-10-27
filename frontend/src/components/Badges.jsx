// Status badge component
export const StatusBadge = ({ status }) => {
  const classMap = {
    'Submitted': 'badge-submitted',
    'Acknowledged': 'badge-acknowledged',
    'In Progress': 'badge-in-progress',
    'Resolved': 'badge-resolved',
    'Rejected': 'badge-rejected',
    'Cancelled': 'badge-cancelled',
  };
  return (
    <span className={`badge ${classMap[status] || 'badge-submitted'}`}>
      {status}
    </span>
  );
};

// Priority badge component
export const PriorityBadge = ({ priority }) => {
  const classMap = {
    'Critical': 'badge-critical',
    'High': 'badge-high',
    'Medium': 'badge-medium',
    'Low': 'badge-low',
  };
  const dotColor = {
    'Critical': 'var(--color-coral)',
    'High': 'var(--color-amber)',
    'Medium': '#3b82f6',
    'Low': 'var(--color-success)',
  };
  return (
    <span className={`badge ${classMap[priority] || 'badge-medium'}`}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: dotColor[priority] || '#3b82f6',
        display: 'inline-block',
        flexShrink: 0,
      }} />
      {priority}
    </span>
  );
};

// Issue code display
export const IssueCode = ({ code, large }) => (
  <span className={large ? 'issue-code-large' : 'issue-code'}>{code}</span>
);

// Role badge
export const RoleBadge = ({ role }) => {
  const styles = {
    admin: { background: 'rgba(139,92,246,0.12)', color: '#6d28d9', border: '1px solid rgba(139,92,246,0.3)' },
    staff: { background: 'rgba(201,240,107,0.2)', color: '#4a6c10', border: '1px solid rgba(201,240,107,0.4)' },
    student: { background: 'rgba(136,153,170,0.12)', color: 'var(--color-slate-dark)', border: '1px solid rgba(136,153,170,0.3)' },
  };
  return (
    <span className="badge" style={styles[role] || styles.student}>
      {role?.charAt(0).toUpperCase() + role?.slice(1)}
    </span>
  );
};
