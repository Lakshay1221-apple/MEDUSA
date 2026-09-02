'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { arcsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatScoreDelta, formatDate } from '@/lib/utils/formatters';
import { Zap, TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';

export default function ScorePage() {
  const { data: arcs = [], isLoading } = useQuery({
    queryKey: queryKeys.arcs.all,
    queryFn: () => arcsApi.list(),
  });
  const activeArc = arcs[0];

  const { data: arcDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: queryKeys.arcs.detail(activeArc?.id || ''),
    queryFn: () => arcsApi.getById(activeArc?.id || ''),
    enabled: !!activeArc?.id,
  });

  if (isLoading || isDetailLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!activeArc) {
    return (
      <AppShell>
        <div className="py-16 text-center font-mono text-slate-400">NO ACTIVE ARC REGISTERED</div>
      </AppShell>
    );
  }

  const scoreEvents = (arcDetail as any)?.score_events || [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">
              AUTHORITATIVE SCORE & LEDGER
            </h1>
            <p className="text-xs text-slate-400">
              Server-enforced point balance. Immutable financial-grade audit transactions.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase">CURRENT ARC SCORE</span>
            <span className="text-2xl font-black text-amber-400">
              {activeArc.user_stats?.current_score || 0} PTS
            </span>
          </div>
        </div>

        {/* Score Ledger Transaction Stream */}
        <Card className="p-5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>IMMUTABLE SCORE TRANSACTION FEED</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scoreEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                NO SCORE TRANSACTIONS RECORDED YET
              </div>
            ) : (
              <div className="divide-y divide-surface-border text-xs">
                {scoreEvents.map((evt: any) => {
                  const isPositive = evt.delta > 0;
                  return (
                    <div
                      key={evt.id}
                      className="py-3.5 flex items-center justify-between flex-wrap gap-2 hover:bg-surface-muted/30 px-2 rounded transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-1.5 rounded border ${
                            isPositive
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-red-950 text-red-400 border-red-800'
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">{evt.reason}</div>
                          {evt.metadata && (
                            <div className="text-[11px] text-slate-400">
                              Metadata: {typeof evt.metadata === 'string' ? evt.metadata : JSON.stringify(evt.metadata)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-sm font-black ${
                            isPositive ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {formatScoreDelta(evt.delta)} PTS
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {formatDate(evt.occurred_at, 'MMM dd, HH:mm:ss')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
