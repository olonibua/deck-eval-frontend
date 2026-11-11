'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, UploadCloud, XCircle } from 'lucide-react';
import { sortByFilename } from '@/lib/shared';
import { cn } from '@/lib/cn';

interface UploadItem {
  name: string;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
}

function uploadWithProgress<T>(url: string, field: string, file: File, onProgress: (pct: number) => void, method = 'POST'): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append(field, file, file.name);
    xhr.open(method, url);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      const body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as T);
      else reject(new Error(body?.message ?? `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(form);
  });
}

export function Dropzone<T>({
  url,
  accept,
  label,
  hint,
  field = 'files',
  method,
  multiple = true,
  onUploaded,
  compact,
}: {
  url: string;
  accept: string;
  label: string;
  hint: string;
  field?: string;
  method?: string;
  multiple?: boolean;
  onUploaded: (result: T) => void;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);

  async function handle(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = sortByFilename([...fileList].map((file) => ({ name: file.name, file }))).map((f) => f.file);
    setItems(files.map((f) => ({ name: f.name, progress: 0, status: 'queued' })));
    for (const [index, file] of files.entries()) {
      const update = (patch: Partial<UploadItem>) => setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
      update({ status: 'uploading' });
      try {
        const result = await uploadWithProgress<T>(`/api${url}`, field, file, (progress) => update({ progress }), method);
        update({ status: 'done', progress: 100 });
        onUploaded(result);
      } catch (error) {
        update({ status: 'error', error: (error as Error).message });
      }
    }
    setTimeout(() => setItems((current) => current.filter((i) => i.status === 'error')), 2500);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handle(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border-strong bg-subtle text-center transition-colors hover:border-primary',
          compact ? 'px-4 py-4' : 'px-6 py-8',
          dragging && 'border-primary bg-primary-soft',
        )}
      >
        <UploadCloud className="h-6 w-6 text-fg-muted" aria-hidden />
        <p className="text-sm font-medium">{label}</p>
        <p className="text-meta text-fg-muted">{hint}</p>
        <input
          ref={input}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            void handle(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5" aria-live="polite">
          {items.map((item, i) => (
            <li key={`${item.name}-${i}`} className="flex items-center gap-3 text-sm">
              <span className="w-48 truncate">{item.name}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-muted">
                <div className={cn('h-full transition-all', item.status === 'error' ? 'bg-danger' : 'bg-primary')} style={{ width: `${item.progress}%` }} />
              </div>
              {item.status === 'done' && <CheckCircle2 className="h-4 w-4 text-success" aria-label="Uploaded" />}
              {item.status === 'error' && (
                <span className="inline-flex items-center gap-1 text-meta text-danger">
                  <XCircle className="h-4 w-4" aria-hidden /> {item.error}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
