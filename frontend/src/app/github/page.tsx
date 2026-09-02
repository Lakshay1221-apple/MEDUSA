'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { githubApi, usersApi, arcsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { Github, CheckCircle2, AlertTriangle, ShieldCheck, Play, Unlink } from 'lucide-react';

export default function GithubPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError, score: toastScore } = useToast();

  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [oauthToken, setOauthToken] = useState('');

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => usersApi.getProfile(),
  });

  const { data: arcs = [] } = useQuery({
    queryKey: queryKeys.arcs.all,
    queryFn: () => arcsApi.list(),
  });
  const activeArc = arcs[0];

  const connectMutation = useMutation({
    mutationFn: (dto: any) => githubApi.connect(dto),
    onSuccess: (res) => {
      toastSuccess('GITHUB CONNECTED', `Authenticated as @${res.username}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      setIsConnectOpen(false);
      setUsername('');
      setOauthToken('');
    },
    onError: (err: any) => toastError('CONNECTION FAILED', err.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => githubApi.disconnect(),
    onSuccess: () => {
      toastSuccess('GITHUB DISCONNECTED', 'OAuth credentials revoked.');
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    onError: (err: any) => toastError('DISCONNECT FAILED', err.message),
  });

  const verifyTodayMutation = useMutation({
    mutationFn: () => {
      const today = new Date().toISOString().split('T')[0];
      return githubApi.verifyToday(activeArc?.id || '', today);
    },
    onSuccess: (res) => {
      toastSuccess(
        'GITHUB AUDIT COMPLETE',
        `Verified ${res.verifiedCount} task(s). Discrepancies flagged: ${res.discrepancyCount}`,
      );
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err: any) => toastError('VERIFICATION FAILED', err.message),
  });

  const isConnected = !!user?.github_username;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">
              GITHUB EXECUTION VERIFICATION
            </h1>
            <p className="text-xs text-slate-400">
              Authoritative code-level delivery proofs. Tasks completed via verified commits receive score bonuses.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {isConnected && activeArc && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => verifyTodayMutation.mutate()}
                isLoading={verifyTodayMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <Play className="h-4 w-4 mr-1.5" />
                VERIFY TODAY&apos;S COMMITS & PRS
              </Button>
            )}
            {isConnected ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => disconnectMutation.mutate()}
                isLoading={disconnectMutation.isPending}
              >
                <Unlink className="h-4 w-4 mr-1.5" />
                DISCONNECT GITHUB
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => setIsConnectOpen(true)}>
                <Github className="h-4 w-4 mr-1.5" />
                CONNECT GITHUB ACCOUNT
              </Button>
            )}
          </div>
        </div>

        {/* Connection Status Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-surface-muted border border-surface-border">
                <Github className="h-8 w-8 text-slate-100" />
              </div>
              <div>
                <div className="text-sm font-bold uppercase text-slate-100">
                  {isConnected ? `@${user.github_username}` : 'NO GITHUB ACCOUNT LINKED'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {isConnected
                    ? 'Encrypted AES-256 token active. Worker ready for commit inspection.'
                    : 'Link your GitHub account to enable automatic task verification through git commits.'}
                </div>
              </div>
            </div>

            <span
              className={`text-xs font-bold uppercase px-3 py-1 rounded border ${
                isConnected
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-surface-subtle text-slate-400 border-surface-border'
              }`}
            >
              {isConnected ? 'INTEGRATION VERIFIED' : 'UNLINKED'}
            </span>
          </div>
        </Card>

        {/* Connect Modal */}
        <Modal
          isOpen={isConnectOpen}
          onClose={() => setIsConnectOpen(false)}
          title="CONNECT GITHUB ACCOUNT"
          description="Token will be encrypted with AES-256 on the backend server."
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await connectMutation.mutateAsync({
                github_username: username,
                oauth_token: oauthToken,
              });
            }}
            className="space-y-4 font-mono"
          >
            <Input
              label="GitHub Handle / Username"
              placeholder="e.g. torvalds"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              label="GitHub Personal Access Token (repo scope)"
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              value={oauthToken}
              onChange={(e) => setOauthToken(e.target.value)}
              helperText="Requires read access to commits and pull requests."
              required
            />

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsConnectOpen(false)}>
                CANCEL
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={connectMutation.isPending}>
                AUTHORIZE & ENCRYPT
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
