'use client';

import React, { useEffect, useState } from 'react';
import { api, Department, User } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

export default function RoutingDepartmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newDeptName, setNewDeptName] = useState('');
  const [creatingDept, setCreatingDept] = useState(false);

  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [savingMembers, setSavingMembers] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    const load = async () => {
      try {
        setLoading(true);
        const [deptData, staffData] = await Promise.all([
          api.departments.list(),
          api.staff.list(),
        ]);
        setDepartments(deptData);
        setStaff(staffData);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load departments');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDeptName.trim();
    if (!trimmed || creatingDept) return;

    setCreatingDept(true);
    try {
      await api.departments.create({ name: trimmed });
      setNewDeptName('');
      const data = await api.departments.list();
      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create department');
    } finally {
      setCreatingDept(false);
    }
  };

  const openMembersModal = (dept: Department) => {
    setEditingDept(dept);
    const currentIds = (dept.users ?? []).map((u) => u.id);
    setSelectedMemberIds(currentIds);
    setMembersModalOpen(true);
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSaveMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || savingMembers) return;

    setSavingMembers(true);
    try {
      await api.departments.setMembers(editingDept.id, { userIds: selectedMemberIds });
      const data = await api.departments.list();
      setDepartments(data);
      setMembersModalOpen(false);
      setEditingDept(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update department members');
    } finally {
      setSavingMembers(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 text-sm">Only admins can view routing settings.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading departments...</div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 ios-appear">
          {error}
        </div>
      )}

      <Card className="p-6 ios-appear">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Departments & assignment</h2>
            <p className="mt-1 text-sm text-gray-600 max-w-xl">
              Create departments and assign agents so conversations can be automatically routed to the right team.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateDepartment} className="flex flex-col sm:flex-row gap-3 max-w-xl mb-6">
          <Input
            label="New department"
            value={newDeptName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeptName(e.target.value)}
            placeholder="e.g. Sales, Support, Billing"
          />
          <div className="flex items-end">
            <Button type="submit" disabled={creatingDept}>
              {creatingDept ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>

        <Card className="overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {departments.map((dept, index) => (
                <tr 
                  key={dept.id}
                  className="ios-appear"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {dept.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        dept.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {dept.users && dept.users.length > 0
                      ? `${dept.users.length} member${dept.users.length === 1 ? '' : 's'}`
                      : 'No agents yet'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                    <button
                      onClick={() => {
                        const newName = window.prompt('New department name', dept.name);
                        if (!newName || !newName.trim()) return;
                        api.departments
                          .update(dept.id, { name: newName.trim() })
                          .then(async () => {
                            const data = await api.departments.list();
                            setDepartments(data);
                          })
                          .catch((err) => {
                            setError(
                              err instanceof Error
                                ? err.message
                                : 'Failed to update department',
                            );
                          });
                      }}
                      className="text-gray-700 hover:text-gray-900 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          !window.confirm(
                            'Delete this department? It must not be attached to any conversations.',
                          )
                        ) {
                          return;
                        }
                        try {
                          await api.departments.delete(dept.id);
                          const data = await api.departments.list();
                          setDepartments(data);
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : 'Failed to delete department',
                          );
                        }
                      }}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => openMembersModal(dept)}
                      className="text-gray-700 hover:text-gray-900 font-medium"
                    >
                      Manage members
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Card>

      <Modal
        isOpen={membersModalOpen && !!editingDept}
        title={editingDept ? `Manage members  ${editingDept.name}` : 'Manage members'}
        onClose={() => {
          if (savingMembers) return;
          setMembersModalOpen(false);
          setEditingDept(null);
        }}
      >
        <form onSubmit={handleSaveMembers} className="space-y-4">
          {staff.length === 0 ? (
            <div className="text-sm text-gray-600">
              You have no agents yet. Create staff on the Staff page first.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto border border-gray-200 rounded-xl p-3">
              {staff.map((agent) => (
                <label key={agent.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(agent.id)}
                    onChange={() => toggleMember(agent.id)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span>{agent.name}</span>
                  <span className="text-gray-500 text-xs">{agent.email}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (savingMembers) return;
                setMembersModalOpen(false);
                setEditingDept(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={savingMembers}>
              {savingMembers ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
