'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleDeleteOrganization = async () => {
    const orgName = user?.orgName || 'your organization';
    const confirmed = window.prompt(
      `This will permanently delete "${orgName}" and ALL its data. Type DELETE to confirm:`,
    );
    if (confirmed !== 'DELETE') return;

    setLoading(true);
    try {
      await api.auth.deleteOrganization();
      logout();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete organization',
      });
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.auth.updateProfile({
        name,
        email,
        password: password || undefined,
        profilePicture: profilePicture || undefined,
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated' });
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be under 2MB' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicture(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      {message.text && (
        <div
          className={`p-3 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50/90 text-emerald-700 border border-emerald-200'
              : 'bg-red-50/95 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => document.getElementById('avatar-upload')?.click()}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-cyan-50 overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0 group"
        >
          {profilePicture ? (
            <img src={profilePicture} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-lg font-semibold text-gray-500">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="absolute inset-0 bg-black/40 text-[10px] text-white font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            Edit
          </span>
        </button>
        <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        <div>
          <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
          <p className="text-xs text-indigo-600">{user?.role}</p>
        </div>
      </div>
      <form onSubmit={handleUpdateProfile} className="rounded-xl bg-white/80 ring-1 ring-inset ring-indigo-200/80 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="pt-2 border-t border-indigo-100/90 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Security</p>
          <Input
            label="New password"
            type="password"
            placeholder="Leave blank to keep current"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>

      {user?.role === 'ADMIN' && (
        <div className="rounded-xl bg-red-50/80 ring-1 ring-inset ring-red-100 p-5">
          <h3 className="text-sm font-semibold text-red-800">Danger zone</h3>
          <p className="text-xs text-red-600/90 mt-1 mb-4">
            Permanently delete your organization and all data. This cannot be undone.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDeleteOrganization}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Delete organization
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/settings/data-policy')}
              className="text-xs text-red-700 hover:underline"
            >
              Data deletion policy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
