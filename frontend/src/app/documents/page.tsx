'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { documentsApi, arcsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { DocumentFileType } from '@/lib/types/domain';
import { Upload, FileText, Bot, CheckCircle, Clock, AlertTriangle, Layers } from 'lucide-react';

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filename, setFilename] = useState('');
  const [fileType, setFileType] = useState<DocumentFileType>('MARKDOWN');
  const [content, setContent] = useState('');

  const { data: arcs = [] } = useQuery({
    queryKey: queryKeys.arcs.all,
    queryFn: () => arcsApi.list(),
  });
  const activeArc = arcs[0];

  const { data: documents = [], isLoading } = useQuery({
    queryKey: queryKeys.documents.byArc(activeArc?.id || ''),
    queryFn: () => documentsApi.list(activeArc?.id || ''),
    enabled: !!activeArc?.id,
  });

  const uploadMutation = useMutation({
    mutationFn: (dto: any) => documentsApi.upload(dto),
    onSuccess: (doc) => {
      toastSuccess('DOCUMENT INGESTED', `AI extraction pipeline started for ${doc.original_filename}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.byArc(activeArc?.id || '') });
      setIsUploadOpen(false);
      setFilename('');
      setContent('');
    },
    onError: (err: any) => toastError('INGESTION FAILED', err.message),
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !filename.trim()) {
      toastError('VALIDATION FAILED', 'Filename and content are required.');
      return;
    }
    await uploadMutation.mutateAsync({
      arc_id: activeArc?.id || '',
      file_type: fileType,
      filename,
      content,
    });
  };

  const fileTypeOptions = [
    { value: 'MARKDOWN', label: 'MARKDOWN (.md)' },
    { value: 'TXT', label: 'PLAIN TEXT (.txt)' },
    { value: 'PDF', label: 'PDF (Base64 / Text)' },
  ];

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
              DOCUMENT INGESTION & AI EXTRACTION
            </h1>
            <p className="text-xs text-slate-400">
              Asynchronous pipeline: Hierarchical Parser &rarr; 1500-char Chunker &rarr; LLM Task Extraction &rarr; Review &rarr; Backlog.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-1.5" />
            INGEST CURRICULUM DOCUMENT
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-surface rounded-lg border border-dashed border-surface-border">
            <FileText className="h-10 w-10 text-slate-600 mx-auto" />
            <div className="text-sm font-bold uppercase text-slate-300">NO DOCUMENTS INGESTED</div>
            <p className="text-xs text-slate-500">
              Upload course syllabi, roadmaps, or curriculum markdown to automatically generate structured tasks.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="card-tactical-interactive flex flex-col justify-between p-5 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        doc.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : doc.status === 'FAILED'
                          ? 'bg-red-950 text-red-400 border-red-800'
                          : 'bg-purple-950 text-purple-400 border-purple-800 animate-pulse'
                      }`}
                    >
                      {doc.status}
                    </span>
                    <span className="text-xs text-slate-400 uppercase">{doc.file_type}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight line-clamp-1">
                    {doc.original_filename}
                  </h3>

                  {doc._count && (
                    <div className="flex items-center space-x-4 text-xs text-slate-400 pt-2 border-t border-surface-border">
                      <span>{doc._count.sections} sections</span>
                      <span>{doc._count.chunks} chunks</span>
                      <span className="text-purple-400 font-bold">{doc._count.tasks} AI tasks</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-surface-border">
                  <Link href={`/documents/${doc.id}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      REVIEW EXTRACTIONS &rarr;
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Upload Document Modal */}
        <Modal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          title="INGEST DOCUMENT FOR AI EXTRACTION"
          description="Uploads to storage and triggers parser and structured task generation."
          maxWidth="lg"
        >
          <form onSubmit={handleUpload} className="space-y-4 font-mono">
            <Input
              label="Document Filename"
              placeholder="e.g. distributed-systems-curriculum.md"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              required
            />
            <Select
              label="Document Type"
              value={fileType}
              onChange={(e) => setFileType(e.target.value as DocumentFileType)}
              options={fileTypeOptions}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium tracking-wide uppercase text-slate-400">
                Document Content (Markdown / Text)
              </label>
              <textarea
                className="w-full rounded bg-surface-muted px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 border border-surface-border font-mono transition-colors focus:outline-none focus:border-blue-500"
                rows={10}
                placeholder="Paste curriculum syllabus, modules, or markdown sections here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-surface-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>
                CANCEL
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={uploadMutation.isPending}>
                START ASYNC PROCESSING
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
