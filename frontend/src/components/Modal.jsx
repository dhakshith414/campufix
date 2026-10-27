import { X } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Confirmation modal for destructive actions
 */
export const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Confirm', confirmVariant = 'danger' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-navy)' }}>{title}</h2>
          <button onClick={onCancel} className="btn btn-ghost btn-sm" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p style={{ color: 'var(--color-slate-dark)', fontSize: 'var(--text-sm)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className={`btn btn-${confirmVariant}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Generic form modal wrapper
 */
export const FormModal = ({ isOpen, onClose, title, children, width = 520 }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-navy)' }}>{title}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
