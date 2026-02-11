'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api, User } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

export default function StaffPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [staff, setStaff] = useState<User[]>([]);
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

  useEffect(() => {
    if (!isAdmin) {
      // Non-admins should not be here; send them back to conversations.
      router.push('/dashboard');
      return;
    }

    loadStaff();
  }, [isAdmin]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await api.staff.list();
      setStaff(data);
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
    if (!confirm('Deactivate this staff member? They will no longer be able to log in or receive new conversations.')) {
      return;
    }

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

  if (!isAdmin) {
    // While redirecting, show nothing special.
    return null;
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500">Loading staff...</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="h-full flex flex-col bg-white">
          {/* Header */}
          <div className="border-b border-gray-200 px-8 py-6 flex items-center justify-between ios-appear">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
              <p className="text-gray-600 mt-1">
                Manage your agents and see who is handling conversations.
              </p>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>Add Staff Member</Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {staff.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                No staff members yet. Use "Add Staff Member" to invite your first agent.
              </div>
            ) : (
              <Card className="overflow-hidden ios-appear">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Conversations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last active
                      </th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staff.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              member.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              member.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {member.assignedCount ?? 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {member.createdAt
                            ? new Date(member.createdAt).toLocaleString()
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                          <button
                            onClick={() => openEditModal(member)}
                            className="text-gray-700 hover:text-gray-900 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeactivate(member.id)}
                            disabled={deactivatingId === member.id}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            {member.isActive
                              ? deactivatingId === member.id
                                ? 'Deactivating...'
                                : 'Deactivate'
                              : 'Deactivate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>

        {/* Add Staff Modal */}
        <Modal
          isOpen={isAddModalOpen}
          title="Add Staff Member"
          onClose={() => {
            if (creating) return;
            setIsAddModalOpen(false);
          }}
        >
          <form onSubmit={handleCreateStaff} className="space-y-4">
            <Input
              label="Full name"
              placeholder="e.g. Jane Doe"
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
              label="Temporary password"
              placeholder="Set a starter password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (creating) return;
                  setIsAddModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Staff Modal */}
        <Modal
          isOpen={isEditModalOpen}
          title="Edit Staff Member"
          onClose={() => {
            if (savingEdit) return;
            setIsEditModalOpen(false);
            setEditingStaff(null);
          }}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Input
              label="Full name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
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
                { value: 'AGENT', label: 'AGENT' },
                { value: 'ADMIN', label: 'ADMIN' },
              ]}
            />
            <Input
              type="password"
              label="Reset password (optional)"
              placeholder="Leave blank to keep current password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span>Active</span>
              </label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (savingEdit) return;
                    setIsEditModalOpen(false);
                    setEditingStaff(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
