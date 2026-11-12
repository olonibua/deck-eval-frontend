'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  answerKey,
  LIVE_POLL_MS,
  type AnswerMap,
  type FieldRef,
  type LiveSyncDTO,
  type LiveSyncInput,
  type PresenceDTO,
  type SubStatus,
  type TeamMemberDTO,
} from '@/lib/shared';

const HIDDEN_POLL_MS = 5000;
const TYPING_MS = 2000;

export interface RemoteEdit {
  userId: string;
  ref: FieldRef;
  at: number;
}

interface Options {
  submissionId: string | null;
  enabled: boolean;
  meId: string;
  viewing: string | null;
  isUnsent: (key: string) => boolean;
  lastSavedAt: (key: string) => string | null;
  onRemote: (changes: AnswerMap) => void;
  onStatus: (status: SubStatus) => void;
  team: TeamMemberDTO[];
}

export function useLiveSheet({ submissionId, enabled, meId, viewing, isUnsent, lastSavedAt, onRemote, onStatus, team: initialTeam }: Options) {
  const [presence, setPresence] = useState<PresenceDTO[]>([]);
  const [team, setTeam] = useState(initialTeam);
  const [lastEdit, setLastEdit] = useState<RemoteEdit | null>(null);
  const since = useRef<string | null>(null);
  const focus = useRef<FieldRef | null>(null);
  const typingUntil = useRef(0);
  const viewingRef = useRef(viewing);
  const handlers = useRef({ isUnsent, lastSavedAt, onRemote, onStatus });
  const status = useRef<SubStatus | null>(null);
  viewingRef.current = viewing;
  handlers.current = { isUnsent, lastSavedAt, onRemote, onStatus };

  const apply = useCallback(
    (data: LiveSyncDTO) => {
      const { isUnsent: unsent, lastSavedAt: savedAt, onRemote: remote, onStatus: changed } = handlers.current;
      const changes: AnswerMap = {};
      let edit: RemoteEdit | null = null;
      for (const answer of data.answers) {
        if (answer.byId === meId) continue;
        const key = answerKey(answer.fieldId, answer.responseId);
        if (unsent(key)) continue;
        const mine = savedAt(key);
        if (mine && answer.updatedAt <= mine) continue;
        changes[key] = answer.value;
        if (answer.byId) edit = { userId: answer.byId, ref: { fieldId: answer.fieldId, responseId: answer.responseId }, at: Date.now() };
      }
      if (Object.keys(changes).length) remote(changes);
      if (edit && since.current) setLastEdit(edit);
      since.current = data.now;
      setPresence(data.presence);
      setTeam(data.team);
      if (status.current && status.current !== data.status) changed(data.status);
      status.current = data.status;
    },
    [meId],
  );

  useEffect(() => {
    if (!submissionId || !enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      const body: LiveSyncInput = {
        since: since.current,
        viewing: viewingRef.current,
        focus: focus.current,
        typing: Date.now() < typingUntil.current,
      };
      try {
        const res = await fetch(`/api/submissions/${submissionId}/live`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok && !stopped) apply((await res.json()) as LiveSyncDTO);
      } catch {
        // offline: the next tick catches up from the last sync time
      }
      if (!stopped) timer = setTimeout(tick, document.visibilityState === 'hidden' ? HIDDEN_POLL_MS : LIVE_POLL_MS);
    }

    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
      void fetch(`/api/submissions/${submissionId}/live/leave`, { method: 'POST', credentials: 'include', keepalive: true }).catch(() => undefined);
    };
  }, [submissionId, enabled, apply]);

  const setFocus = useCallback((ref: FieldRef | null) => {
    focus.current = ref;
  }, []);

  const markTyping = useCallback(() => {
    typingUntil.current = Date.now() + TYPING_MS;
  }, []);

  return { presence, team, lastEdit, setFocus, markTyping };
}
