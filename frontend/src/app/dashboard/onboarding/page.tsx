'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Select } from '@/components/ui/Select';
import { countries } from '@/lib/countries';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    
    const [organizationName, setOrganizationName] = useState('');
    const [country, setCountry] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.auth.onboard({
                organizationName,
                country,
                phone,
                address,
            });
            await refreshUser();
            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.orgOnboarded) {
            // If they managed to come here but are already onboarded, send them to dashboard
            router.push('/dashboard');
        }
    }, [user, router]);

    if (user?.orgOnboarded) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-gray-100 ios-appear">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
                    <p className="text-gray-500 text-sm">Please provide some details about your business to get started.</p>
                </div>
                
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        label="Business / Organization Name"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        required
                        placeholder="Acme Inc."
                    />
                    <Select
                        label="Country"
                        value={country}
                        onChange={(val) => setCountry(val)}
                        options={[{ label: 'Select a country', value: '' }, ...countries.map(c => ({ label: c, value: c }))]}
                    />
                    <Input
                        label="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        required
                        placeholder="e.g. 2348000000000"
                    />
                    <Input
                        label="Address (Optional)"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Main St, City"
                    />

                    <Button type="submit" className="w-full mt-4" disabled={loading}>
                        {loading ? 'Saving...' : 'Continue to Dashboard'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
