'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { UploadCloud } from 'lucide-react';
import { guessFileRoles, type IntakeFileDTO, type ProjectDTO, type TagDTO, type TaskDraft } from '@/lib/shared';
import { Card } from '../ui/card';
import { DraftReview } from './draft-review';
import { AttachButton, FileDropTarget, FileTray } from './file-tray';
import { filesFromClipboard, useIntakeFiles } from './use-intake-files';

function blankDraft(projects: ProjectDTO[]): TaskDraft {
  return {
    title: '',
    projectId: projects[0]?.id ?? '',
    priority: 2,
    tagNames: [],
    dueAt: null,
    instructionsHtml: '',
    userRequestHtml: '',
    files: [],
    notes: null,
  };
}

function syncFiles(draft: TaskDraft, files: IntakeFileDTO[]): TaskDraft {
  const present = new Set(files.map((f) => f.id));
  const kept = draft.files.filter((f) => present.has(f.fileId));
  const known = new Set(kept.map((f) => f.fileId));
  const fresh = guessFileRoles(files.filter((f) => !known.has(f.id)));
  if (fresh.length === 0 && kept.length === draft.files.length) return draft;
  return { ...draft, files: [...kept, ...fresh] };
}

const STORAGE_KEY = 'deck-eval:smart-import';

export function SmartImport({ projects, tags, onCreate }: { projects: ProjectDTO[]; tags: TagDTO[]; onCreate: (draft: TaskDraft) => Promise<boolean> }) {
  const [draft, setDraft, loaded] = usePersistentState<TaskDraft>(STORAGE_KEY, blankDraft(projects));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialIds = useMemo(() => (loaded ? draft.files.map((f) => f.fileId) : []), [loaded]);
  const intake = useIntakeFiles(initialIds);
  const [version, setVersion] = useState(0);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (loaded && intake.ready) setDraft((current) => syncFiles(current, intake.files));
  }, [loaded, intake.ready, intake.files, setDraft]);

  async function create() {
    setCreating(true);
    const ok = await onCreate(draft);
    setCreating(false);
    if (ok) {
      intake.reset();
      setDraft(blankDraft(projects));
      setVersion((v) => v + 1);
    }
  }

  if (!loaded) return null;

  return (
    <div
      className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
      onPaste={(e) => {
        const pasted = filesFromClipboard(e);
        if (pasted.length) {
          e.preventDefault();
          void intake.add(pasted);
        }
      }}
    >
      <Card className="p-5">
        <p className="stamp mb-1">Files</p>
        <p className="mb-4 text-sm text-fg-muted">
          Files named like <span className="font-medium text-fg">response-a.pdf</span> or <span className="font-medium text-fg">Deck B.pptx</span> become responses. Everything else becomes an input file. You can change any of it on the right.
        </p>
        <FileDropTarget onFiles={(files) => void intake.add(files)}>
          <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border-strong bg-subtle px-4 py-8 text-center">
            <UploadCloud className="h-6 w-6 text-fg-muted" aria-hidden />
            <p className="text-sm font-medium">Drop PDFs, PowerPoints, images or documents</p>
            <p className="text-[12px] text-fg-muted">You can also paste screenshots anywhere on this page</p>
            <AttachButton onFiles={(files) => void intake.add(files)} label="Choose files" />
          </div>
        </FileDropTarget>
        <div className="mt-4">
          <FileTray intake={intake} />
        </div>
      </Card>
      <DraftReview
        draft={draft}
        version={version}
        files={intake.files}
        projects={projects}
        tags={tags}
        creating={creating}
        onChange={setDraft}
        onCreate={() => void create()}
      />
    </div>
  );
}
