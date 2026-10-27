import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { AppLayout } from '../layouts/AppLayout';
import { Spinner } from '../components/UIStates';
import { ArrowLeft, Zap, MapPin, Tag, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
  { value: 'Electrical', icon: '⚡', desc: 'Lights, outlets, circuits' },
  { value: 'Plumbing & Water', icon: '🚿', desc: 'Leaks, pipes, restrooms' },
  { value: 'Cleaning & Sanitation', icon: '🧹', desc: 'Cleaning, waste, hygiene' },
  { value: 'Classroom Equipment', icon: '📽', desc: 'Projectors, AV, boards' },
  { value: 'Internet & Wi-Fi', icon: '📶', desc: 'Network, connectivity' },
  { value: 'Furniture & Infrastructure', icon: '🪑', desc: 'Chairs, desks, fixtures' },
  { value: 'Safety', icon: '🦺', desc: 'Hazards, safety risks' },
  { value: 'Other', icon: '📋', desc: 'Other maintenance issues' },
];

const PRIORITIES = [
  { value: 'Low', label: 'Low', color: 'var(--color-success)', desc: 'Not urgent, can wait' },
  { value: 'Medium', label: 'Medium', color: '#3b82f6', desc: 'Should be addressed soon' },
  { value: 'High', label: 'High', color: 'var(--color-amber)', desc: 'Affecting daily operations' },
  { value: 'Critical', label: 'Critical', color: 'var(--color-coral)', desc: 'Safety risk or major disruption' },
];

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    building: '',
    room: '',
    additionalDetail: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    else if (form.title.trim().length < 5) e.title = 'Title must be at least 5 characters';
    else if (form.title.trim().length > 150) e.title = 'Title is too long (max 150 chars)';
    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.trim().length < 10) e.description = 'Please describe the issue in more detail (min 10 chars)';
    if (!form.category) e.category = 'Please select a category';
    if (!form.building.trim()) e.building = 'Building/Location is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        location: {
          building: form.building.trim(),
          room: form.room.trim(),
          additionalDetail: form.additionalDetail.trim(),
        },
      };
      const res = await issuesAPI.create(payload);
      const { issue } = res.data.data;
      toast.success(`Issue ${issue.issueCode} submitted successfully!`);
      navigate(`/issues/${issue._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit issue. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const setField = (field, value) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--color-slate)', marginBottom: 'var(--space-4)' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
            Report an Issue
          </h1>
          <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)' }}>
            Describe the problem clearly so staff can prioritize and resolve it quickly.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

            {/* Category Selection */}
            <div className="card card-padding">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div style={{ width: 32, height: 32, background: 'var(--color-navy)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tag size={16} color="var(--color-lime)" />
                </div>
                <div>
                  <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 'var(--text-base)' }}>Issue Category</h2>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>What type of problem is this?</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-2)' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setField('category', cat.value)}
                    style={{
                      padding: 'var(--space-3)',
                      border: `2px solid ${form.category === cat.value ? 'var(--color-navy)' : 'var(--color-paper-300)'}`,
                      borderRadius: 'var(--radius-lg)',
                      background: form.category === cat.value ? 'var(--color-navy)' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontSize: 'var(--text-xl)', marginBottom: 4 }}>{cat.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: form.category === cat.value ? 'var(--color-lime)' : 'var(--color-navy)' }}>
                      {cat.value}
                    </div>
                    <div style={{ fontSize: '10px', color: form.category === cat.value ? 'rgba(245,242,233,0.6)' : 'var(--color-slate)' }}>
                      {cat.desc}
                    </div>
                  </button>
                ))}
              </div>
              {errors.category && <div className="form-error" style={{ marginTop: 'var(--space-2)' }}>{errors.category}</div>}
            </div>

            {/* Title & Description */}
            <div className="card card-padding">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div style={{ width: 32, height: 32, background: 'var(--color-navy)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={16} color="var(--color-lime)" />
                </div>
                <div>
                  <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 'var(--text-base)' }}>Issue Details</h2>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>Be specific to help staff resolve faster</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label required" htmlFor="issue-title">Issue Title</label>
                  <input
                    id="issue-title"
                    type="text"
                    className={`form-input ${errors.title ? 'error' : ''}`}
                    placeholder="e.g. Projector not working in B-204"
                    value={form.title}
                    onChange={e => setField('title', e.target.value)}
                    maxLength={150}
                    disabled={loading}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {errors.title ? <span className="form-error">{errors.title}</span> : <span />}
                    <span className="form-hint">{form.title.length}/150</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required" htmlFor="issue-description">Description</label>
                  <textarea
                    id="issue-description"
                    className={`form-textarea ${errors.description ? 'error' : ''}`}
                    placeholder="Describe what's wrong, when it started, and how it affects the campus community…"
                    value={form.description}
                    onChange={e => setField('description', e.target.value)}
                    rows={5}
                    maxLength={2000}
                    disabled={loading}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {errors.description ? <span className="form-error">{errors.description}</span> : <span />}
                    <span className="form-hint">{form.description.length}/2000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="card card-padding">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div style={{ width: 32, height: 32, background: 'var(--color-navy)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={16} color="var(--color-lime)" />
                </div>
                <div>
                  <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 'var(--text-base)' }}>Location</h2>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>Where on campus is this issue?</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label required" htmlFor="issue-building">Building / Block</label>
                  <input
                    id="issue-building"
                    type="text"
                    className={`form-input ${errors.building ? 'error' : ''}`}
                    placeholder="e.g. Main Building, Block B, Library"
                    value={form.building}
                    onChange={e => setField('building', e.target.value)}
                    disabled={loading}
                  />
                  {errors.building && <span className="form-error">{errors.building}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="issue-room">Room / Floor</label>
                  <input
                    id="issue-room"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Room 204, 2nd Floor"
                    value={form.room}
                    onChange={e => setField('room', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="issue-detail">Additional Detail</label>
                  <input
                    id="issue-detail"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Near the main board"
                    value={form.additionalDetail}
                    onChange={e => setField('additionalDetail', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="card card-padding">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div style={{ width: 32, height: 32, background: 'var(--color-navy)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={16} color="var(--color-lime)" />
                </div>
                <div>
                  <h2 style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 'var(--text-base)' }}>Priority</h2>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>How urgent is this issue?</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-2)' }}>
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setField('priority', p.value)}
                    style={{
                      padding: 'var(--space-3)',
                      border: `2px solid ${form.priority === p.value ? p.color : 'var(--color-paper-300)'}`,
                      borderRadius: 'var(--radius-lg)',
                      background: form.priority === p.value ? `${p.color}12` : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: form.priority === p.value ? p.color : 'var(--color-navy)', marginBottom: 2 }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-slate)' }}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)} disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                id="submit-issue-btn"
              >
                {loading ? (
                  <><Spinner size="sm" /> Submitting…</>
                ) : (
                  <>Submit Issue Report</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
