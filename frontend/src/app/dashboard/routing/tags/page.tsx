'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api, Tag, TagType } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

const TAG_TYPES: { id: TagType; label: string; description: string }[] = [
  {
    id: 'CUSTOMER',
    label: 'Contact',
    description: 'Labels on people — e.g. VIP, Enterprise. Apply from a contact profile.',
  },
  {
    id: 'CONVERSATION',
    label: 'Conversation',
    description: 'Labels on threads — e.g. Urgent, Sales lead. Apply from a conversation.',
  },
];

const PRESET_COLORS = ['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#6B7280'];

export default function RoutingTagsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [tagType, setTagType] = useState<TagType>('CUSTOMER');
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.tags.list(tagType);
      setTags(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, [tagType]);

  useEffect(() => {
    if (!isAdmin) return;
    loadTags();
  }, [isAdmin, loadTags]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name || creating) return;

    setCreating(true);
    try {
      await api.tags.create({ name, type: tagType, color: newColor });
      setNewName('');
      await loadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`Delete tag "${tag.name}"? It will be removed from all ${tagType === 'CUSTOMER' ? 'contacts' : 'conversations'}.`)) {
      return;
    }

    setDeletingId(tag.id);
    try {
      await api.tags.delete(tag.id);
      await loadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        Only admins can manage tags.
      </div>
    );
  }

  const activeTypeMeta = TAG_TYPES.find((t) => t.id === tagType)!;

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div>
        <h2 className="text-base font-semibold text-gray-900">Tags</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create labels for contacts and conversations. Assign them from each profile or thread.
        </p>
      </div>

      <div
        className="flex p-1 rounded-xl bg-gray-100/80 ring-1 ring-inset ring-black/[0.04]"
        role="tablist"
        aria-label="Tag type"
      >
        {TAG_TYPES.map((t) => {
          const isActive = tagType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTagType(t.id)}
              className={`
                flex-1 py-2 px-3 rounded-[10px] text-[13px] font-medium transition-all duration-200
                ${isActive ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/[0.06]' : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-500">{activeTypeMeta.description}</p>

      <form
        onSubmit={handleCreate}
        className="p-4 rounded-xl bg-gray-50/80 ring-1 ring-inset ring-black/[0.04] space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              label="New tag name"
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
              placeholder={tagType === 'CUSTOMER' ? 'VIP' : 'Urgent'}
            />
          </div>
          <div className="sm:w-auto">
            <span className="block text-sm font-medium text-gray-700 mb-2">Color</span>
            <div className="flex items-center gap-2 h-[50px]">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`
                    w-7 h-7 rounded-full border-2 transition-transform
                    ${newColor === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'}
                  `}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={creating || !newName.trim()}>
            {creating ? 'Creating…' : 'Add tag'}
          </Button>
        </div>
      </form>

      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          {activeTypeMeta.label} tags
        </h3>

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
        ) : tags.length === 0 ? (
          <div className="py-10 text-center rounded-xl bg-gray-50/60 ring-1 ring-inset ring-black/[0.04]">
            <p className="text-sm text-gray-500">No {activeTypeMeta.label.toLowerCase()} tags yet.</p>
            <p className="text-xs text-gray-400 mt-1">Create one above — try &ldquo;VIP&rdquo; for contacts.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl bg-white ring-1 ring-inset ring-black/[0.04] overflow-hidden">
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium text-gray-800 border border-gray-200/80"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color ?? '#6B7280' }}
                  />
                  {tag.name}
                </span>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => handleDelete(tag)}
                  disabled={deletingId === tag.id}
                  className="text-xs font-medium text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                >
                  {deletingId === tag.id ? 'Deleting…' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
