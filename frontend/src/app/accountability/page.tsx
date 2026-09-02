'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { accountabilityApi, arcsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils/formatters';
import { ShieldAlert, ShieldCheck, Play, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';

export default function AccountabilityPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: arcs = [] } = useQuery({
    queryKey: queryKeys.arcs.all,
    queryFn: () => arcsApi.list(),
  });
  const activeArc = arcs[0];

  const { data: tags = [], isLoading: isTagsLoading } = useQuery({
    queryKey: queryKeys.accountability.tags,
    queryFn: () => accountabilityApi.listTags(),
  });

  const { data: findings = [], isLoading: isFindingsLoading } = useQuery({
    queryKey: queryKeys.accountability.findings(activeArc?.id || ''),
    queryFn: () => accountabilityApi.listFindings(activeArc?.id || ''),
    enabled: !!activeArc?.id,
  });

  const evaluateMutation = useMutation({
    mutationFn: () => accountabilityApi.evaluate(activeArc?.id || ''),
    onSuccess: (res) => {
      toastSuccess(
        'ACCOUNTABILITY EVALUATION COMPLETE',
        `Generated ${res.findings.length} findings, assigned ${res.assignedTags.length} tags.`,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.accountability.tags });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountability.findings(activeArc?.id || ''),
      });
    },
    onError: (err: any) => toastError('EVALUATION FAILED', err.message),
  });

  if (!activeArc) {
    return (
      <AppShell>
        <div className="py-16 text-center font-mono text-slate-400">NO ACTIVE ARC REGISTERED</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">
              ACCOUNTABILITY & BEHAVIORAL RULE ENGINE
            </h1>
            <p className="text-xs text-slate-400">
              Deterministic, fact-based behavioral audits. Zero arbitrary insults; pure measurable consequence.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => evaluateMutation.mutate()}
            isLoading={evaluateMutation.isPending}
            className="bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300"
          >
            <Play className="h-4 w-4 mr-1.5" />
            RUN ACCOUNTABILITY EVALUATION
          </Button>
        </div>

        {/* Assigned Behavioral Tags Grid */}
        <Card className="p-5 space-y-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <span>ACTIVE BEHAVIORAL TAGS ({tags.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isTagsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : tags.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                NO BEHAVIORAL TAGS ASSIGNED YET. RUN EVALUATION TO AUDIT DATA.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tags.map((tag) => {
                  const isPositive = [
                    'IRON_STREAK',
                    'SHIPPER',
                    'DEEP_WORKER',
                    'NO_QUIT',
                    'EXECUTOR',
                    'OSS_CONTRIBUTOR',
                  ].includes(tag.tag);

                  return (
                    <div
                      key={tag.id}
                      className={`p-4 rounded border text-xs space-y-2 ${
                        isPositive
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                          : 'bg-red-950/40 border-red-800/60 text-red-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <div className="flex items-center space-x-2">
                          {isPositive ? (
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <ShieldAlert className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-sm tracking-wider uppercase">{tag.tag}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {formatDate(tag.assigned_at, 'MMM dd')}
                        </span>
                      </div>

                      {tag.evidence && (
                        <div className="p-2 rounded bg-surface border border-surface-border text-[11px] text-slate-300 font-mono">
                          <span className="text-slate-500 block text-[10px] uppercase">EVIDENCE:</span>
                          <pre className="text-[10px] overflow-x-auto">
                            {typeof tag.evidence === 'string'
                              ? tag.evidence
                              : JSON.stringify(tag.evidence, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fact-Based Findings Log */}
        <Card className="p-5 space-y-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span>DETERMINISTIC FACT FINDINGS LOG ({findings.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isFindingsLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : findings.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                NO ACCOUNTABILITY FINDINGS RECORDED
              </div>
            ) : (
              <div className="space-y-3">
                {findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-4 rounded bg-surface-muted border border-surface-border text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-bold">
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                          {finding.severity}
                        </span>
                        <span className="text-slate-200 uppercase">{finding.type}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {formatDate(finding.created_at, 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed">{finding.message}</p>

                    {finding.facts && (
                      <div className="pt-2 border-t border-surface-border/50 text-[11px] text-slate-400">
                        <span className="text-slate-500">VERIFIED FACTS: </span>
                        {typeof finding.facts === 'string'
                          ? finding.facts
                          : JSON.stringify(finding.facts)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
