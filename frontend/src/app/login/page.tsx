'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastError('VALIDATION FAILED', 'Email and password are required.');
      return;
    }

    try {
      setIsLoading(true);
      await login({ email, password });
      toastSuccess('AUTHENTICATED', 'Operator session initialized.');
      router.push('/dashboard');
    } catch (err: any) {
      toastError('ACCESS DENIED', err.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-tactical-grid">
      <div className="w-full max-w-md rounded-lg bg-surface border border-surface-border p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded bg-blue-600/20 border border-blue-500/50 items-center justify-center text-blue-400 font-mono font-black text-xl mb-2">
            M
          </div>
          <h1 className="text-xl font-mono font-bold tracking-widest uppercase text-slate-100">
            MEDUSA ACCESS
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Execution Enforcement System — Authenticate Operator
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Operator Email"
            type="email"
            placeholder="operator@medusa.system"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Security Passkey"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            ENTER COMMAND CENTER
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-surface-border">
          <p className="text-xs font-mono text-slate-400">
            No active clearance?{' '}
            <Link href="/signup" className="text-blue-400 hover:underline uppercase tracking-wide">
              Initialize Arc Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
