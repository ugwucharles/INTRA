'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    organizationName: '',
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md ios-appear">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo1.png" alt="Logo" width={120} height={40} className="h-10 w-auto" />
          </div>
          <p className="text-gray-600">Create your organization</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get started</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Organization Name"
              value={formData.organizationName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, organizationName: e.target.value })}
              required
              placeholder="Acme Inc."
            />

            <Input
              label="Your Name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="John Doe"
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="••••••••"
              minLength={6}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-orange-500 hover:text-orange-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

