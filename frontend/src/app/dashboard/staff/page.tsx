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
import { StaffCard } from '@/components/ui/StaffCard';

export default function StaffPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [staff, setStaff] = useState<User[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (isAdmin) {
      loadStaff();
    }
  }, [isAdmin]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const [staffData, conversationsData] = await Promise.all([
        api.staff.list(),
        api.conversations.list()
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
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-full flex items-center justify-center bg-[#FFFCF1]/50">
            <div className="text-gray-500 text-sm">Only admins can view staff management.</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }


  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-full flex items-center justify-center bg-[#FFFCF1]/50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              <div className="text-gray-400 font-medium animate-pulse">Loading staff...</div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Real stats calculation based on conversation data
  const staffWithStats = staff.map(member => {
    const memberConvs = conversations.filter(c => c.assignedTo === member.id);
    const departmentName = member.departments && member.departments.length > 0
      ? member.departments[0]
      : null;
    const defaultTitle = departmentName || member.email;

    return {
      ...member,
      title: member.role === 'ADMIN' ? 'System Administrator' : defaultTitle,
      stats: {
        completed: memberConvs.filter(c => c.status === 'CLOSED').length,
        open: memberConvs.filter(c => c.status === 'OPEN').length,
        pending: memberConvs.filter(c => c.status === 'PENDING').length,
      }
    };
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="h-full flex flex-col bg-[#FFFCF1]/50 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between ios-appear">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                Staff <span className="text-gray-400 font-medium">({staff.length})</span>
              </h1>
              <p className="text-gray-500 mt-1">Manage your team and track their workload across the CRM.</p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="bg-gray-100/50 border border-gray-200 p-1 rounded-xl flex items-center mr-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-orange-500 shadow-sm text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Card
                </button>
              </div>

              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="shadow-md shadow-orange-500/10"
              >
                + Add Staff
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 pb-12">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 ios-appear">
                {error}
              </div>
            )}

            {staff.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center ios-appear">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 font-medium">No staff members found.</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-2 text-orange-500 font-bold text-sm hover:underline"
                >
                  Add your first agent
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ios-appear">
                {staffWithStats.map((member) => (
                  <StaffCard
                    key={member.id}
                    staff={member as any}
                    onClick={() => openEditModal(member)}
                  />
                ))}
              </div>
            ) : (
              <Card className="overflow-hidden shadow-sm border-gray-100 ios-appear">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4" />
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                      {staff.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold text-xs ring-4 ring-white shadow-sm">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-bold text-gray-900">{member.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${member.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${member.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-300'}`} />
                              <span className="text-xs font-semibold text-gray-600">{member.isOnline ? 'Online' : 'Offline'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs space-x-4">
                            <button onClick={() => openEditModal(member)} className="text-gray-400 hover:text-orange-500 font-bold transition-colors">Edit</button>
                            <button
                              onClick={() => handleDeactivate(member.id)}
                              disabled={deactivatingId === member.id}
                              className="text-gray-400 hover:text-red-500 font-bold transition-colors"
                            >
                              {member.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>


        {/* Add Staff Modal */}
        <Modal
          isOpen={isAddModalOpen}
          title="Add Staff"
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
              label="Password"
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
          title="Edit Staff"
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
