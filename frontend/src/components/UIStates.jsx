// Shared loading, empty, and error state components

export const Spinner = ({ size = 'md', variant = '' }) => (
  <span className={`spinner spinner-${size === 'lg' ? 'lg' : ''} ${variant === 'white' ? 'spinner-white' : ''}`} />
);

export const PageLoading = ({ message = 'Loading...' }) => (
  <div className="page-loading">
    <span className="spinner spinner-lg" />
    <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)' }}>{message}</p>
  </div>
);

export const ErrorMessage = ({ message, retry }) => (
  <div className="alert alert-error" style={{ margin: 'var(--space-4) 0' }}>
    <span>⚠</span>
    <div style={{ flex: 1 }}>
      <strong>Something went wrong</strong>
      <div style={{ marginTop: '4px', opacity: 0.9 }}>{message}</div>
    </div>
    {retry && (
      <button
        onClick={retry}
        className="btn btn-sm"
        style={{ background: 'var(--color-coral)', color: 'white', border: 'none' }}
      >
        Retry
      </button>
    )}
  </div>
);

export const EmptyState = ({ icon, title, description, action }) => (
  <div className="empty-state">
    {icon && (
      <div className="empty-state-icon">
        {icon}
      </div>
    )}
    <div className="empty-state-title">{title}</div>
    {description && <p className="empty-state-description">{description}</p>}
    {action && action}
  </div>
);

export const FormError = ({ message }) =>
  message ? <div className="form-error">{message}</div> : null;
