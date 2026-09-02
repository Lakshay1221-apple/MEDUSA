'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [commitmentPhrase, setCommitmentPhrase] = useState('I ACCEPT THE COST');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !commitmentPhrase) {
      toastError('VALIDATION FAILED', 'All fields and commitment phrase are required.');
      return;
    }

    try {
      setIsLoading(true);
      await signup({
        name,
        email,
        password,
        timezone,
        commitment_phrase: commitmentPhrase,
      });
      toastSuccess('OPERATOR REGISTERED', 'Arc execution profile created.');
      router.push('/dashboard');
    } catch (err: any) {
      toastError('REGISTRATION FAILED', err.message || 'Could not register user.');
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
            OPERATOR ONBOARDING
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Define commitment phrase. Violations incur severe penalties.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name / Call-Sign"
            type="text"
            placeholder="Operator 01"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Official Email"
            type="email"
            placeholder="operator@medusa.system"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Security Passkey (min 6 chars)"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <Input
            label="Execution Timezone"
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            required
          />
          <div className="space-y-1.5 pt-1">
            <Input
              label="Authoritative Commitment Phrase"
              type="text"
              value={commitmentPhrase}
              onChange={(e) => setCommitmentPhrase(e.target.value)}
              helperText="Must be typed verbatim to skip or abandon commitments."
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-3"
            isLoading={isLoading}
          >
            ACCEPT TERMS & INITIALIZE
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-surface-border">
          <p className="text-xs font-mono text-slate-400">
            Existing operator?{' '}
            <Link href="/login" className="text-blue-400 hover:underline uppercase tracking-wide">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
