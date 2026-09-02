'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { usersApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { Settings as SettingsIcon, Shield, User, Globe } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => usersApi.getProfile(),
  });

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [commitmentPhrase, setCommitmentPhrase] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setTimezone(user.timezone);
      setCommitmentPhrase(user.commitment_phrase);
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (dto: any) => usersApi.updateProfile(dto),
    onSuccess: (updated) => {
      toastSuccess('PROFILE UPDATED', 'Operator security parameters persisted.');
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    onError: (err: any) => toastError('UPDATE FAILED', err.message),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileMutation.mutateAsync({
      name,
      timezone,
      commitment_phrase: commitmentPhrase,
    });
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6 max-w-3xl mx-auto">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl mx-auto font-mono">
        <div className="pb-4 border-b border-surface-border">
          <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">
            OPERATOR SETTINGS & PARAMETERS
          </h1>
          <p className="text-xs text-slate-400">
            Manage call-sign, execution timezone, and authoritative commitment phrase.
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Call-Sign / Operator Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div>
              <Input
                label="Registered Email (Immutable)"
                value={user?.email || ''}
                disabled
                helperText="Primary identifier for authentication and score ledger."
              />
            </div>

            <Input
              label="Operational Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              helperText="Determines daily closure cut-offs and scheduled date boundaries."
              required
            />

            <div className="pt-2 border-t border-surface-border space-y-1.5">
              <Input
                label="Authoritative Commitment Phrase"
                value={commitmentPhrase}
                onChange={(e) => setCommitmentPhrase(e.target.value)}
                helperText="Exact phrase required by the backend state machine to concede or abandon tasks."
                required
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-surface-border">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={updateProfileMutation.isPending}
              >
                SAVE PARAMETERS
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
