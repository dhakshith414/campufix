import { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { AppLayout } from '../layouts/AppLayout';
import { RoleBadge } from '../components/Badges';
import { PageLoading, ErrorMessage, EmptyState, Spinner } from '../components/UIStates';
import { FormModal } from '../components/Modal';
import { Search, Plus, Users, UserCheck, UserX } from 'lucide-react';
import { formatDistanceToNow } from '../utils/time';

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  // Create user modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'staff', department: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await usersAPI.list({ page, limit: 20, ...(search && { search }), ...(roleFilter && { role: roleFilter }) });
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async (userId, isActive) => {
    try {
      await usersAPI.update(userId, { isActive: !isActive });
      toast.success(`User ${isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      await usersAPI.create(createForm);
      toast.success(`${createForm.role} account created`);
      setShowCreate(false);
      setCreateForm({ name: '', email: '', password: '', role: 'staff', department: '' });
      fetchUsers();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
              User Management
            </h1>
            <p style={{ color: 'var(--color-slate)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
              {pagination.total} user{pagination.total !== 1 ? 's' : ''} · Provision and manage campus accounts
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <Plus size={16} /> Create Staff/Admin Account
          </button>
        </div>

        {/* Search & filters */}
        <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 36 }}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <select className="form-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
              <option value="">All roles</option>
              <option value="student">Students</option>
              <option value="staff">Staff</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {error && <ErrorMessage message={error} retry={fetchUsers} />}

        {loading ? (
          <PageLoading message="Loading users..." />
        ) : users.length === 0 ? (
          <div className="card">
            <EmptyState icon={<Users size={32} />} title="No users found" description="No users match your search." />
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: 'var(--text-sm)' }}>{u.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>{u.email}</div>
                      </td>
                      <td><RoleBadge role={u.role} /></td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-dark)' }}>{u.department || '—'}</td>
                      <td>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: u.isActive ? 'var(--color-success)' : 'var(--color-slate)' }}>
                          {u.isActive ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate)' }}>{formatDistanceToNow(u.createdAt)}</td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(u._id, u.isActive)}
                          className={`btn btn-sm ${u.isActive ? 'btn-ghost' : 'btn-outline'}`}
                          style={{ fontSize: 'var(--text-xs)' }}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {u.isActive ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Activate</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create user modal */}
      <FormModal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Staff/Admin Account">
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {createError && <div className="alert alert-error">{createError}</div>}

            <div className="form-group">
              <label className="form-label required">Full Name</label>
              <input type="text" className="form-input" value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label required">Email</label>
              <input type="email" className="form-input" value={createForm.email}
                onChange={e => setCreateForm({ ...createForm, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label required">Password</label>
              <input type="password" className="form-input" placeholder="Min 8 chars, uppercase + lowercase + number"
                value={createForm.password}
                onChange={e => setCreateForm({ ...createForm, password: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label required">Role</label>
                <select className="form-select" value={createForm.role}
                  onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input type="text" className="form-input" placeholder="e.g. Maintenance"
                  value={createForm.department}
                  onChange={e => setCreateForm({ ...createForm, department: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={createLoading}>
                {createLoading ? <><Spinner size="sm" /> Creating…</> : 'Create Account'}
              </button>
            </div>
          </div>
        </form>
      </FormModal>
    </AppLayout>
  );
}
