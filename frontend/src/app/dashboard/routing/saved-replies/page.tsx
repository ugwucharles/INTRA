'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api, SavedReply, Department } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

export default function RoutingSavedRepliesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [savedReplies, setSavedReplies] = useState<SavedReply[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<'ALL' | string>('ALL');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [shortcut, setShortcut] = useState('');
  const [body, setBody] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('NONE');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [replies, depts] = await Promise.all([
        api.savedReplies.list(),
        api.departments.list().catch(() => []),
      ]);
      setSavedReplies(replies);
      setDepartments(depts);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved replies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setShortcut('');
    setBody('');
    setSelectedDeptId('NONE');
    setIsModalOpen(true);
  };

  const openEditModal = (reply: SavedReply) => {
    setEditingId(reply.id);
    setName(reply.name);
    setShortcut(reply.shortcut || '');
    setBody(reply.body);
    setSelectedDeptId(reply.departmentId || 'NONE');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim() || submitting) return;

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        shortcut: shortcut.trim() ? shortcut.trim().replace(/^\//, '') : undefined, // clean any leading slash
        body: body.trim(),
        departmentId: selectedDeptId === 'NONE' ? null : selectedDeptId,
      };

      if (editingId) {
        await api.savedReplies.update(editingId, payload);
      } else {
        await api.savedReplies.create(payload);
      }

      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the saved reply "${name}"?`)) return;

    try {
      await api.savedReplies.delete(id);
      setSavedReplies((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete saved reply');
    }
  };

  const handleToggleActive = async (reply: SavedReply) => {
    try {
      const updated = await api.savedReplies.update(reply.id, {
        isActive: !reply.isActive,
      });
      setSavedReplies((prev) =>
        prev.map((r) => (r.id === reply.id ? { ...r, isActive: updated.isActive } : r)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    }
  };

  // Filter and search computation
  const filteredReplies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return savedReplies.filter((reply) => {
      // Dept filter
      if (departmentFilter !== 'ALL') {
        const deptMatches =
          departmentFilter === 'NONE'
            ? !reply.departmentId
            : reply.departmentId === departmentFilter;
        if (!deptMatches) return false;
      }
      // Search query
      if (q) {
        const nameMatches = reply.name.toLowerCase().includes(q);
        const shortcutMatches = reply.shortcut?.toLowerCase().includes(q);
        const bodyMatches = reply.body.toLowerCase().includes(q);
        if (!nameMatches && !shortcutMatches && !bodyMatches) return false;
      }
      return true;
    });
  }, [savedReplies, searchQuery, departmentFilter]);

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50/50">
        <div className="text-gray-500 text-sm">Only admins can manage saved replies.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Saved replies</h2>
          <p className="text-xs text-gray-500 mt-1">
            Create templates for agents to quickly reply using shortcuts (e.g. type <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">/shortcut</code>).
          </p>
        </div>
        <Button onClick={openAddModal} className="sm:self-start">
          Add saved reply
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, shortcut, or body…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={[
              { value: 'ALL', label: 'All departments' },
              { value: 'NONE', label: 'No department' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading replies…</div>
      ) : filteredReplies.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-white/50">
          {searchQuery || departmentFilter !== 'ALL' ? 'No replies match your criteria.' : 'No saved replies created yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredReplies.map((reply) => {
            const dept = departments.find((d) => d.id === reply.departmentId);
            return (
              <div
                key={reply.id}
                className="rounded-xl bg-white ring-1 ring-inset ring-black/[0.04] p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:ring-black/[0.08] transition-all"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{reply.name}</h3>
                    {reply.shortcut && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-800 uppercase tracking-wider">
                        /{reply.shortcut}
                      </span>
                    )}
                    {dept && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">
                        {dept.name}
                      </span>
                    )}
                    {!reply.isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-3">
                    {reply.body}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(reply)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      reply.isActive
                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100/80'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80'
                    }`}
                  >
                    {reply.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(reply)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(reply.id, reply.name)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50/50 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit saved reply' : 'Create saved reply'}
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500">
              Define the template name, keyboard shortcut, and department availability.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              placeholder="e.g. Welcome Message"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Shortcut (Optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
                <input
                  type="text"
                  placeholder="e.g. welcome"
                  value={shortcut}
                  onChange={(e) => setShortcut(e.target.value)}
                  className="w-full pl-6 pr-3 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-colors"
                />
              </div>
              <p className="text-[10px] text-gray-400">
                Agents can type this shortcut after a slash to autocomplete this message.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Department association</label>
              <Select
                value={selectedDeptId}
                onChange={setSelectedDeptId}
                options={[
                  { value: 'NONE', label: 'All departments (Global)' },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Message Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type the message template here…"
                rows={5}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Saving…' : editingId ? 'Save' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
