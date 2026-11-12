'use client';

import { useRef, useState } from 'react';
import { AlertCircle, FileText, Loader2, Paperclip, Presentation, X } from 'lucide-react';
import type { IntakeFileDTO } from '@/lib/shared';
import { cn } from '@/lib/cn';
import type { IntakeFiles } from './use-intake-files';

export const INTAKE_ACCEPT = '.pdf,.pptx,.ppt,.key,.odp,.png,.jpg,.jpeg,.webp,.gif,.docx,.doc,.xlsx,.xls,.csv,.txt,.md';

export function FileDropTarget({ onFiles, children, className }: { onFiles: (files: File[]) => void; children: React.ReactNode; className?: string }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDragging(false)}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setDragging(false);
        onFiles([...e.dataTransfer.files]);
      }}
      className={cn('relative', className)}
    >
      {children}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary-soft/80 text-sm font-medium">
          Drop files to attach
        </div>
      )}
    </div>
  );
}

export function AttachButton({ onFiles, label = 'Attach files' }: { onFiles: (files: File[]) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="inline-flex h-9 items-center gap-1.5 rounded-sm px-2.5 text-sm text-fg-muted transition-colors hover:bg-muted hover:text-fg"
      >
        <Paperclip className="h-4 w-4" aria-hidden /> {label}
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept={INTAKE_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) onFiles([...e.target.files]);
          e.target.value = '';
        }}
      />
    </>
  );
}

const KIND_ICON = { pdf: FileText, presentation: Presentation, image: FileText, document: FileText } as const;

function FileTile({ file, onRemove }: { file: IntakeFileDTO; onRemove?: () => void }) {
  const Icon = KIND_ICON[file.kind];
  return (
    <li className="group relative w-36 overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex aspect-[4/3] items-center justify-center bg-subtle">
        {file.status === 'processing' ? (
          <Loader2 className="h-5 w-5 animate-spin text-fg-muted" aria-label="Processing" />
        ) : file.status === 'failed' ? (
          <AlertCircle className="h-5 w-5 text-danger" aria-hidden />
        ) : file.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.thumbnailUrl} alt="" className="h-full w-full object-cover object-top" />
        ) : (
          <Icon className="h-6 w-6 text-fg-muted" aria-hidden />
        )}
      </div>
      <div className="px-2 py-1.5">
        <p className="truncate text-[13px] font-medium" title={file.name}>
          {file.name}
        </p>
        <p className={cn('text-[11px]', file.status === 'failed' ? 'text-danger' : 'text-fg-muted')}>
          {file.status === 'processing' && 'Reading file…'}
          {file.status === 'failed' && (file.error ?? 'Could not read this file')}
          {file.status === 'ready' && (file.pageCount ? `${file.pageCount} ${file.pageCount === 1 ? 'page' : 'pages'}` : 'Text only')}
        </p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
          className="absolute top-1 right-1 rounded-full bg-fg/80 p-1 text-page opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </li>
  );
}

export function FileTray({ intake, files, removable = true }: { intake: IntakeFiles; files?: IntakeFileDTO[]; removable?: boolean }) {
  const shown = files ?? intake.files;
  if (shown.length === 0 && intake.pending.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Attached files">
      {shown.map((file) => (
        <FileTile key={file.id} file={file} onRemove={removable ? () => intake.remove(file.id) : undefined} />
      ))}
      {intake.pending.map((p) => (
        <li key={p.key} className="flex w-36 flex-col justify-between rounded-md border border-border bg-surface p-2">
          <p className="truncate text-[13px] font-medium">{p.name}</p>
          {p.error ? (
            <div className="flex items-start justify-between gap-1 text-[11px] text-danger">
              <span>{p.error}</span>
              <button type="button" onClick={() => intake.dismissFailed(p.key)} aria-label="Dismiss">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${p.progress}%` }} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
