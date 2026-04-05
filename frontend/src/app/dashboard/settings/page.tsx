'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
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

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');

    // (Integrations moved to Channels page)

    const handleDeleteOrganization = async () => {
        const orgName = user?.orgName || 'your organization';
        const confirmed = window.prompt(
          `This will permanently delete "${orgName}" and ALL its data. This CANNOT be undone.\n\nType DELETE to confirm:`,
        );
        if (confirmed !== 'DELETE') {
            if (confirmed !== null) {
                alert('Confirmation text did not match. Deletion cancelled.');
            }
            return;
        }
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await api.auth.deleteOrganization();
            logout();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete organization' });
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
            setMessage({ type: 'success', text: 'Profile updated successfully' });
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image size should be less than 2MB' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePicture(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="h-full flex flex-col bg-[#FFFCF1]/50 overflow-y-auto">
                    {/* Header */}
                    <div className="px-8 py-8 ios-appear">
                        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-500 mt-1">Manage your account preferences and profile information.</p>
                    </div>

                    <div className="flex-1 px-8 pb-12 max-w-4xl space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left Column: Avatar & Quick Info */}
                            <div className="md:col-span-1">
                                <Card className="p-6 text-center shadow-sm border-gray-100">
                                    <div className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                        <div className="w-full h-full rounded-full bg-orange-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center transition-transform group-hover:scale-[1.02]">
                                            {profilePicture ? (
                                                <img src={profilePicture} alt={user?.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                                            ) : null}
                                            <div className={`flex items-center justify-center w-full h-full ${profilePicture ? 'hidden' : ''}`}>
                                                <span className="text-3xl font-bold text-orange-300">
                                                    {user?.name?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change photo</span>
                                        </div>
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                    <h2 className="font-bold text-gray-900">{user?.name}</h2>
                                    <p className="text-xs text-gray-500 mt-1">{user?.role}</p>
                                </Card>
                            </div>

                            {/* Right Column: Profile Form */}
                            <div className="md:col-span-2 space-y-6">
                                <Card className="p-8 shadow-sm border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6">Profile Information</h3>

                                    {message.text && (
                                        <div className={`mb-6 p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                            }`}>
                                            {message.text}
                                        </div>
                                    )}

                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <Input
                                                label="Full Name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                            />
                                            <Input
                                                label="Email Address"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="pt-4 border-t border-gray-50">
                                            <h4 className="text-sm font-bold text-gray-900 mb-4">Security</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <Input
                                                    label="New Password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                                <Input
                                                    label="Confirm New Password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-2 italic">Leave blank if you don't want to change password.</p>
                                        </div>

                                        <div className="flex justify-end pt-6">
                                            <Button type="submit" disabled={loading} className="px-8">
                                                {loading ? 'Saving Changes...' : 'Save Profile Settings'}
                                            </Button>
                                        </div>
                                    </form>
                                </Card>

                                {user?.role === 'ADMIN' && (
                                    <div className="mt-8 pt-6 border-t border-gray-100">
                                        <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                                            <h4 className="font-bold text-red-700 text-sm mb-1">Danger Zone</h4>
                                            <p className="text-xs text-red-600/80 mb-5">
                                                Permanently delete your organization and all data. This action cannot be reversed.
                                            </p>
                                            <div className="flex flex-col sm:flex-row items-start font-medium sm:items-center gap-4">
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteOrganization}
                                                    disabled={loading}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-semibold disabled:opacity-50 shadow-sm"
                                                >
                                                    Delete Organization
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => router.push('/dashboard/settings/data-policy')}
                                                    className="text-xs text-red-600 hover:text-red-800 underline flex items-center gap-1"
                                                >
                                                    User Data Deletion Policy
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
