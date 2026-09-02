'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { notificationsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils/formatters';
import { Bell, Check, ShieldAlert, Zap, Flame, Award } from 'lucide-react';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationsApi.list(),
  });

  const { data: preferences = [] } = useQuery({
    queryKey: queryKeys.notifications.preferences,
    queryFn: () => notificationsApi.getPreferences(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    onError: (err: any) => toastError('FAILED TO MARK READ', err.message),
  });

  const updatePreferenceMutation = useMutation({
    mutationFn: ({ type, enabled, channel }: any) =>
      notificationsApi.updatePreference({ notification_type: type, enabled, channel }),
    onSuccess: () => {
      toastSuccess('PREFERENCE UPDATED', 'Notification channels adjusted.');
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences });
    },
    onError: (err: any) => toastError('UPDATE FAILED', err.message),
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto font-mono">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">
              OPERATIONAL NOTIFICATIONS & DISPATCHES
            </h1>
            <p className="text-xs text-slate-400">
              Direct, fact-based system alerts. Zero fake positivity.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded bg-blue-950 text-blue-400 border border-blue-800">
            UNREAD: {unreadCount}
          </span>
        </div>

        {/* Notifications Feed */}
        <Card className="p-5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-blue-400" />
              <span>SYSTEM DISPATCH FEED</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                NO NOTIFICATIONS RECORDED
              </div>
            ) : (
              <div className="divide-y divide-surface-border text-xs">
                {notifications.map((notif) => {
                  const isUnread = !notif.read_at;
                  return (
                    <div
                      key={notif.id}
                      className={`py-3 px-2 flex items-start justify-between rounded gap-3 transition-colors ${
                        isUnread ? 'bg-surface-muted/60' : 'hover:bg-surface-muted/30'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 font-bold">
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                          )}
                          <span className="text-slate-100 uppercase tracking-wide">
                            {notif.title}
                          </span>
                        </div>
                        <p className="text-slate-300 font-normal leading-relaxed">{notif.body}</p>
                        <span className="text-[10px] text-slate-500 block">
                          {formatDate(notif.created_at, 'MMM dd, HH:mm:ss')}
                        </span>
                      </div>

                      {isUnread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markReadMutation.mutate(notif.id)}
                          className="text-[10px] text-slate-400 hover:text-slate-100"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          ACKNOWLEDGE
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel Preferences */}
        {preferences.length > 0 && (
          <Card className="p-5">
            <CardHeader>
              <CardTitle>NOTIFICATION CHANNEL PREFERENCES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-surface-border text-xs">
                {preferences.map((pref) => (
                  <div
                    key={pref.id}
                    className="py-3 flex items-center justify-between flex-wrap gap-2"
                  >
                    <div>
                      <div className="font-bold text-slate-200 uppercase">
                        {pref.notification_type}
                      </div>
                      <div className="text-[10px] text-slate-500">Channel: {pref.channel}</div>
                    </div>

                    <Button
                      variant={pref.enabled ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() =>
                        updatePreferenceMutation.mutate({
                          type: pref.notification_type,
                          enabled: !pref.enabled,
                          channel: pref.channel,
                        })
                      }
                      className="text-[10px] px-3 py-1"
                    >
                      {pref.enabled ? 'ENABLED' : 'MUTED'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
