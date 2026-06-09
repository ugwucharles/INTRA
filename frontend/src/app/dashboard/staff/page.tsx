'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardPageShell } from '@/components/Layout/DashboardPageShell';
import { api, User } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { StaffCard } from '@/components/ui/StaffCard';

type ViewMode = 'list' | 'grid';

export default function StaffPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [staff, setStaff] = useState<User[]>([]);
  const [conversations, setConversations] = useState<{ assignedTo?: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'AGENT'>('AGENT');
  const [newIsActive, setNewIsActive] = useState(true);

  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    if (isAdmin) loadStaff();
  }, [isAdmin]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const [staffData, conversationsData] = await Promise.all([
        api.staff.list(),
        api.conversations.list(),
      ]);
      setStaff(staffData);
      setConversations(conversationsData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const resetFormState = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('AGENT');
    setNewIsActive(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim() || creating) return;

    setCreating(true);
    try {
      await api.staff.create({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
      });
      resetFormState();
      setIsAddModalOpen(false);
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create staff member');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (member: User) => {
    setEditingStaff(member);
    setNewName(member.name || '');
    setNewEmail(member.email || '');
    setNewPassword('');
    setNewRole(member.role);
    setNewIsActive(member.isActive);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || savingEdit) return;

    setSavingEdit(true);
    try {
      await api.staff.update(editingStaff.id, {
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        isActive: newIsActive,
        password: newPassword || undefined,
      });
      resetFormState();
      setEditingStaff(null);
      setIsEditModalOpen(false);
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update staff member');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this staff member? They will no longer be able to log in.')) return;

    setDeactivatingId(id);
    try {
      await api.staff.deactivate(id);
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate staff member');
    } finally {
      setDeactivatingId(null);
    }
  };

  const shell = (content: React.ReactNode) => (
    <ProtectedRoute>
      <DashboardLayout>{content}</DashboardLayout>
    </ProtectedRoute>
  );

  if (!isAdmin) {
    return shell(
      <DashboardPageShell title="Staff" description="Only admins can manage team members." />,
    );
  }

  if (loading) {
    return shell(
      <DashboardPageShell title="Staff">
        <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
      </DashboardPageShell>,
    );
  }

  const staffWithStats = staff.map((member) => {
    const memberConvs = conversations.filter((c) => c.assignedTo === member.id);
    const departmentName =
      member.departments && member.departments.length > 0 ? member.departments[0] : null;
    return {
      ...member,
      title: member.role === 'ADMIN' ? 'Administrator' : departmentName || member.email,
      stats: {
        completed: memberConvs.filter((c) => c.status === 'CLOSED').length,
        open: memberConvs.filter((c) => c.status === 'OPEN').length,
        pending: memberConvs.filter((c) => c.status === 'PENDING').length,
      },
    };
  });

  const viewToggle = (
    <div className="flex items-center gap-2">
      <div
        className="flex p-1 rounded-xl bg-gray-100/80 ring-1 ring-inset ring-black/[0.04]"
        role="tablist"
        aria-label="View mode"
      >
        {(['list', 'grid'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={viewMode === mode}
            onClick={() => setViewMode(mode)}
            className={`
              px-3 py-1.5 rounded-[10px] text-[12px] font-medium capitalize transition-all
              ${viewMode === mode ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/[0.06]' : 'text-gray-500 hover:text-gray-700'}
            `}
          >
            {mode}
          </button>
        ))}
      </div>
      <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
        Add staff
      </Button>
    </div>
  );

  return shell(
    <>
      <DashboardPageShell
        title="Staff"
        description={`${staff.length} team member${staff.length === 1 ? '' : 's'}`}
        actions={viewToggle}
        maxWidth="4xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {staff.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">No staff members yet.</p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 text-sm font-medium text-gray-900 hover:underline"
            >
              Add your first agent
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {staffWithStats.map((member) => (
              <StaffCard key={member.id} staff={member} onClick={() => openEditModal(member)} />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-gray-50 rounded-xl ring-1 ring-inset ring-black/[0.04] overflow-hidden bg-white">
            {staffWithStats.map((member) => (
              <li key={member.id}>
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-600">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{member.name}</span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          member.isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          member.role === 'ADMIN' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{member.email}</p>
                  </div>

                  <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 tabular-nums">
                    <span>{member.stats.open} open</span>
                    <span>{member.stats.pending} pending</span>
                    <span>{member.stats.completed} closed</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => openEditModal(member)}
                      className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeactivate(member.id)}
                      disabled={deactivatingId === member.id}
                      className="px-2 py-1 text-xs font-medium text-gray-400 hover:text-red-600 disabled:opacity-50"
                    >
                      {deactivatingId === member.id ? '…' : 'Deactivate'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardPageShell>

      <Modal
        isOpen={isAddModalOpen}
        title="Add staff"
        onClose={() => {
          if (!creating) setIsAddModalOpen(false);
        }}
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <Input
            label="Full name"
            placeholder="Jane Doe"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <Input
            type="email"
            label="Email"
            placeholder="agent@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            label="Password"
            placeholder="Starter password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => !creating && setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        title="Edit staff"
        onClose={() => {
          if (!savingEdit) {
            setIsEditModalOpen(false);
            setEditingStaff(null);
          }
        }}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input label="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          <Input
            type="email"
            label="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <Select
            label="Role"
            value={newRole}
            onChange={(value) => setNewRole(value as 'ADMIN' | 'AGENT')}
            options={[
              { value: 'AGENT', label: 'Agent' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
          />
          <Input
            type="password"
            label="Reset password (optional)"
            placeholder="Leave blank to keep current"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={newIsActive}
                onChange={(e) => setNewIsActive(e.target.checked)}
                className="rounded border-gray-300"
              />
              Active
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!savingEdit) {
                    setIsEditModalOpen(false);
                    setEditingStaff(null);
                  }
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={savingEdit}>
                {savingEdit ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </>,
  );
}
