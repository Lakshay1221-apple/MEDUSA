'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { workspacesApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { Users, Plus, Key, Trophy, Shield } from 'lucide-react';

export default function WorkspacesPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: queryKeys.workspaces.all,
    queryFn: () => workspacesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: any) => workspacesApi.create(dto),
    onSuccess: (ws) => {
      toastSuccess('WORKSPACE CREATED', `Squad "${ws.name}" created. Invite code: ${ws.invite_code}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      setIsCreateOpen(false);
      setName('');
      setSlug('');
    },
    onError: (err: any) => toastError('CREATION FAILED', err.message),
  });

  const joinMutation = useMutation({
    mutationFn: (dto: any) => workspacesApi.join(dto),
    onSuccess: (res) => {
      toastSuccess('JOINED SQUAD', `Joined workspace "${res.workspace.name}".`);
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      setIsJoinOpen(false);
      setInviteCode('');
    },
    onError: (err: any) => toastError('JOIN FAILED', err.message),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({ name, slug: slug.toLowerCase() });
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    await joinMutation.mutateAsync({ invite_code: inviteCode.trim() });
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">
              SQUAD WORKSPACES & LEADERBOARDS
            </h1>
            <p className="text-xs text-slate-400">
              Multiplayer accountability. Strict privacy enforcement: only public aggregate metrics are shared.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={() => setIsJoinOpen(true)}>
              <Key className="h-4 w-4 mr-1.5" />
              JOIN VIA INVITE CODE
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              CREATE SQUAD WORKSPACE
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-surface rounded-lg border border-dashed border-surface-border">
            <Users className="h-10 w-10 text-slate-600 mx-auto" />
            <div className="text-sm font-bold uppercase text-slate-300">NO SQUAD WORKSPACES JOINED</div>
            <p className="text-xs text-slate-500">
              Create a squad for your team or enter an invite code to compete on the leaderboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => (
              <Card key={ws.id} className="card-tactical-interactive flex flex-col justify-between p-5 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                      ROLE: {ws.role || 'MEMBER'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">CODE: {ws.invite_code}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight">
                    {ws.name}
                  </h3>
                  <div className="text-xs text-slate-500">slug: {ws.slug}</div>
                </div>

                <div className="pt-3 border-t border-surface-border">
                  <Link href={`/workspaces/${ws.id}/leaderboard`}>
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <Trophy className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                      VIEW SQUAD LEADERBOARD &rarr;
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Workspace Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="CREATE SQUAD WORKSPACE"
          description="Generates an exclusive invite code for team members."
        >
          <form onSubmit={handleCreate} className="space-y-4 font-mono">
            <Input
              label="Squad Name"
              placeholder="e.g. Apex Squad"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              required
            />
            <Input
              label="Unique Slug"
              placeholder="e.g. apex-squad"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                CANCEL
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>
                CREATE WORKSPACE
              </Button>
            </div>
          </form>
        </Modal>

        {/* Join Workspace Modal */}
        <Modal
          isOpen={isJoinOpen}
          onClose={() => setIsJoinOpen(false)}
          title="JOIN SQUAD VIA INVITE CODE"
          description="Enter the invite code generated by your squad owner."
        >
          <form onSubmit={handleJoin} className="space-y-4 font-mono">
            <Input
              label="Squad Invite Code"
              placeholder="e.g. MEDUSA-ALPHA100"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsJoinOpen(false)}>
                CANCEL
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={joinMutation.isPending}>
                JOIN SQUAD
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
