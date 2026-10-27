import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { AppLayout } from '../layouts/AppLayout';
import { PageLoading, Spinner } from '../components/UIStates';
import { ArrowLeft } from 'lucide-react';

const CATEGORIES = ['Electrical', 'Plumbing & Water', 'Cleaning & Sanitation', 'Classroom Equipment', 'Internet & Wi-Fi', 'Furniture & Infrastructure', 'Safety', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function EditIssuePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [issue, setIssue] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    issuesAPI.getById(id).then(res => {
      const i = res.data.data.issue;
      const currentUserId = user?._id || user?.id;
      if (user?.role === 'student' && i.reporter?._id !== currentUserId) {
        toast.error('Access denied');
        navigate('/issues');
        return;
      }
      if (user.role === 'student' && i.status !== 'Submitted') {
        toast.error('Issue can no longer be edited');
        navigate(`/issues/${id}`);
        return;
      }
      setIssue(i);
      setForm({
        title: i.title,
        description: i.description,
        category: i.category,
        priority: i.priority,
        building: i.location?.building || '',
        room: i.location?.room || '',
        additionalDetail: i.location?.additionalDetail || '',
      });
    }).catch(() => {
      toast.error('Issue not found');
      navigate('/issues');
    }).finally(() => setLoading(false));
  }, [id]);

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'Title is required';
    else if (form.title.trim().length < 5) e.title = 'Min 5 characters';
    if (!form.description?.trim()) e.description = 'Description is required';
    else if (form.description.trim().length < 10) e.description = 'Min 10 characters';
    if (!form.building?.trim()) e.building = 'Building is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      await issuesAPI.update(id, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        location: { building: form.building.trim(), room: form.room.trim(), additionalDetail: form.additionalDetail.trim() },
      });
      toast.success('Issue updated successfully');
      navigate(`/issues/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update issue');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AppLayout><PageLoading /></AppLayout>;

  return (
    <AppLayout>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-6)', color: 'var(--color-slate)' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-navy)', marginBottom: 'var(--space-2)', letterSpacing: '-0.02em' }}>Edit Issue</h1>
        <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-8)' }}>
          Update the details for <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{issue?.issueCode}</span>
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="card card-padding" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label required">Title</label>
              <input type="text" className={`form-input ${errors.title ? 'error' : ''}`}
                value={form.title || ''} onChange={e => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }); }}
                maxLength={150} disabled={submitting} />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>
            <div className="form-group">
              <label className="form-label required">Description</label>
              <textarea className={`form-textarea ${errors.description ? 'error' : ''}`} rows={5}
                value={form.description || ''} onChange={e => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: '' }); }}
                maxLength={2000} disabled={submitting} />
              {errors.description && <span className="form-error">{errors.description}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} disabled={submitting}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority || ''} onChange={e => setForm({ ...form, priority: e.target.value })} disabled={submitting}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label required">Building / Location</label>
              <input type="text" className={`form-input ${errors.building ? 'error' : ''}`}
                value={form.building || ''} onChange={e => { setForm({ ...form, building: e.target.value }); setErrors({ ...errors, building: '' }); }}
                disabled={submitting} />
              {errors.building && <span className="form-error">{errors.building}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Room / Floor</label>
                <input type="text" className="form-input" value={form.room || ''}
                  onChange={e => setForm({ ...form, room: e.target.value })} disabled={submitting} />
              </div>
              <div className="form-group">
                <label className="form-label">Additional Detail</label>
                <input type="text" className="form-input" value={form.additionalDetail || ''}
                  onChange={e => setForm({ ...form, additionalDetail: e.target.value })} disabled={submitting} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate(`/issues/${id}`)} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <><Spinner size="sm" /> Saving…</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
