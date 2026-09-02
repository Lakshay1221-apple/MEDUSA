'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { documentsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowLeft, Bot, Layers, CheckCircle2, ChevronRight, FileCode } from 'lucide-react';

export default function DocumentDetailPage() {
  const params = useParams();
  const documentId = params.id as string;

  const { data: document, isLoading } = useQuery({
    queryKey: queryKeys.documents.detail(documentId),
    queryFn: () => documentsApi.getById(documentId),
    enabled: !!documentId,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!document) {
    return (
      <AppShell>
        <div className="py-16 text-center font-mono text-slate-400">SOURCE DOCUMENT NOT FOUND</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto font-mono">
        <Link
          href="/documents"
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>BACK TO DOCUMENTS</span>
        </Link>

        {/* Document Header */}
        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                document.status === 'COMPLETED'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-purple-950 text-purple-400 border-purple-800 animate-pulse'
              }`}
            >
              PIPELINE STATUS: {document.status}
            </span>
            <span className="text-xs text-slate-400 uppercase">
              TYPE: {document.file_type} | HASH: {document.content_hash?.substring(0, 8)}...
            </span>
          </div>

          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-100">
            {document.original_filename}
          </h1>

          <div className="flex items-center space-x-6 text-xs text-slate-400 pt-2 border-t border-surface-border">
            <span>SECTIONS: {document.sections?.length || 0}</span>
            <span>CHUNKS: {document.chunks?.length || 0}</span>
            <span className="text-purple-400 font-bold">
              EXTRACTED TASKS: {document.tasks?.length || 0}
            </span>
          </div>
        </Card>

        {/* Hierarchical Document Sections */}
        {document.sections && document.sections.length > 0 && (
          <Card className="p-5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-blue-400" />
                <span>HIERARCHICAL STRUCTURE (MODULE &rarr; SECTION &rarr; TOPIC)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                {document.sections.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-3 rounded bg-surface-muted border border-surface-border space-y-2"
                  >
                    <div className="flex items-center space-x-2 font-bold text-slate-200">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 uppercase">
                        {sec.section_type}
                      </span>
                      <span>{sec.title}</span>
                    </div>

                    {sec.children && sec.children.length > 0 && (
                      <div className="pl-4 space-y-1.5 border-l-2 border-surface-border mt-2">
                        {sec.children.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center space-x-2 text-slate-300 py-1"
                          >
                            <ChevronRight className="h-3 w-3 text-slate-500" />
                            <span className="text-[10px] text-slate-400 uppercase">
                              [{child.section_type}]
                            </span>
                            <span>{child.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Extracted Tasks Review Grid */}
        <Card className="p-5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-4 w-4 text-purple-400" />
              <span>AI-EXTRACTED DIRECTIVES ({document.tasks?.length || 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!document.tasks || document.tasks.length === 0) ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                EXTRACTION IN PROGRESS OR NO TASKS EXTRACTED YET
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {document.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded bg-surface-muted border border-surface-border text-xs space-y-2.5 font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <Badge status={task.status} />
                      <span className="text-amber-400 font-bold">D{task.difficulty}</span>
                    </div>

                    <div className="text-slate-100 font-bold text-sm line-clamp-2">
                      {task.title}
                    </div>

                    {task.description && (
                      <div className="text-slate-400 text-[11px] line-clamp-2 font-normal leading-relaxed">
                        {task.description}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-500 text-[11px] pt-2 border-t border-surface-border/50">
                      <span>Est: {task.estimated_minutes} min</span>
                      <Link href={`/tasks/${task.id}`} className="text-blue-400 hover:underline">
                        INSPECT DIRECTIVE &rarr;
                      </Link>
                    </div>
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
