'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { IntakeFileDTO } from '@/lib/shared';
import { api } from '@/lib/client-api';

export interface PendingUpload {
  key: string;
  name: string;
  progress: number;
  error: string | null;
}

const POLL_MS = 2000;

function send(file: File, onProgress: (pct: number) => void): Promise<IntakeFileDTO> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file, file.name);
    xhr.open('POST', '/api/admin/intake/files');
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      const body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as IntakeFileDTO);
      else reject(new Error(body?.message ?? `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(form);
  });
}

function pastedName(file: File, index: number): File {
  if (file.name && file.name !== 'image.png') return file;
  const stamp = new Date().toISOString().slice(11, 19).replaceAll(':', '');
  const extension = file.type.split('/')[1] ?? 'png';
  return new File([file], `screenshot-${stamp}-${index + 1}.${extension}`, { type: file.type });
}

export function useIntakeFiles(initialIds: string[] = []) {
  const [files, setFiles] = useState<IntakeFileDTO[]>([]);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const loadedInitial = useRef(false);

  useEffect(() => {
    if (loadedInitial.current || initialIds.length === 0) return;
    loadedInitial.current = true;
    api.get<IntakeFileDTO[]>(`/admin/intake/files?ids=${initialIds.join(',')}`).then(setFiles).catch(() => undefined);
  }, [initialIds]);

  const processingIds = files.filter((f) => f.status === 'processing').map((f) => f.id).join(',');
  useEffect(() => {
    if (!processingIds) return;
    const timer = setInterval(async () => {
      const fresh = await api.get<IntakeFileDTO[]>(`/admin/intake/files?ids=${processingIds}`).catch(() => []);
      const byId = new Map(fresh.map((f) => [f.id, f]));
      setFiles((current) => current.map((f) => byId.get(f.id) ?? f));
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [processingIds]);

  const add = useCallback(async (list: File[]): Promise<IntakeFileDTO[]> => {
    const named = list.map(pastedName);
    const batch = named.map((file, i) => ({ key: `${Date.now()}-${i}-${file.name}`, name: file.name, progress: 0, error: null }));
    setPending((current) => [...current, ...batch]);
    const added: IntakeFileDTO[] = [];
    for (const [i, file] of named.entries()) {
      const key = batch[i].key;
      const update = (patch: Partial<PendingUpload>) => setPending((current) => current.map((p) => (p.key === key ? { ...p, ...patch } : p)));
      try {
        const uploaded = await send(file, (progress) => update({ progress }));
        added.push(uploaded);
        setFiles((current) => [...current, uploaded]);
        setPending((current) => current.filter((p) => p.key !== key));
      } catch (error) {
        update({ error: (error as Error).message });
      }
    }
    return added;
  }, []);

  const remove = useCallback((id: string) => setFiles((current) => current.filter((f) => f.id !== id)), []);
  const dismissFailed = useCallback((key: string) => setPending((current) => current.filter((p) => p.key !== key)), []);
  const reset = useCallback(() => {
    setFiles([]);
    setPending([]);
  }, []);

  return { files, pending, add, remove, dismissFailed, reset, uploading: pending.some((p) => !p.error) };
}

export type IntakeFiles = ReturnType<typeof useIntakeFiles>;

export function filesFromClipboard(event: React.ClipboardEvent): File[] {
  return [...event.clipboardData.items].filter((item) => item.kind === 'file').map((item) => item.getAsFile()).filter((f): f is File => !!f);
}
