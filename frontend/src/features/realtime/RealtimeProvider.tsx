'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeSocket } from '@/lib/socket/socketClient';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { queryKeys } from '@/lib/query/keys';

const RealtimeContext = createContext<null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const queryClient = useQueryClient();
  const { score: toastScore, achievement: toastAchievement, info: toastInfo } = useToast();

  useEffect(() => {
    if (status === 'AUTHENTICATED' && user?.id) {
      realtimeSocket.connect(user.id);

      const unsubScore = realtimeSocket.on('SCORE_UPDATED', (payload: any) => {
        if (payload.delta !== undefined) {
          toastScore(
            `SCORE ${payload.delta > 0 ? `+${payload.delta}` : payload.delta}`,
            payload.reason || `New score: ${payload.newScore}`,
          );
        }
        // Targeted cache invalidations
        queryClient.invalidateQueries({ queryKey: ['arcs'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
      });

      const unsubStreak = realtimeSocket.on('STREAK_MILESTONE', (payload: any) => {
        toastScore(
          `STREAK MILESTONE: ${payload.milestone} DAYS`,
          'Momentum unbroken. Execute without compromise.',
        );
        queryClient.invalidateQueries({ queryKey: ['arcs'] });
      });

      const unsubAchievement = realtimeSocket.on('ACHIEVEMENT_UNLOCKED', (payload: any) => {
        toastAchievement(
          `ACHIEVEMENT UNLOCKED: ${payload.title}`,
          'Milestone permanently recorded.',
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.achievements.all });
      });

      return () => {
        unsubScore?.();
        unsubStreak?.();
        unsubAchievement?.();
      };
    } else {
      realtimeSocket.disconnect();
    }
  }, [status, user?.id, queryClient, toastScore, toastAchievement, toastInfo]);

  return <RealtimeContext.Provider value={null}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  return realtimeSocket;
}
