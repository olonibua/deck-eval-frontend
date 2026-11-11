import { Download, FileImage, FileSpreadsheet, FileText, File as FileIcon, Presentation, X } from 'lucide-react';
import type { FileDTO } from '@/lib/shared';
import { formatBytes } from '@/lib/format';

function iconFor(mime: string) {
  if (mime.startsWith('image/')) return FileImage;
  if (mime.includes('spreadsheet') || mime === 'text/csv') return FileSpreadsheet;
  if (mime.includes('presentation')) return Presentation;
  if (mime.includes('pdf') || mime.includes('word') || mime.startsWith('text/')) return FileText;
  return FileIcon;
}

export function FileChip({ file, onRemove }: { file: FileDTO; onRemove?: () => void }) {
  const Icon = iconFor(file.mime);
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-surface py-1.5 pr-1.5 pl-2.5">
      <Icon className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
      <span className="truncate text-sm font-medium">{file.name}</span>
      <span className="shrink-0 text-meta text-fg-subtle">{formatBytes(file.size)}</span>
      <a
        href={file.url}
        download={file.name}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-fg-muted hover:bg-muted hover:text-fg"
        aria-label={`Download ${file.name}`}
      >
        <Download className="h-4 w-4" />
      </a>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-fg-muted hover:bg-danger-soft hover:text-danger"
          aria-label={`Remove ${file.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
