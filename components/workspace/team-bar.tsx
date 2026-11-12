'use client';

import { Users } from 'lucide-react';
import { LIVE_AWAY_MS, type FieldRef, type PresenceDTO, type TeamMemberDTO } from '@/lib/shared';
import { cn } from '@/lib/cn';
import type { RemoteEdit } from '@/hooks/use-live-sheet';

const COLOURS = ['bg-sky', 'bg-pink', 'bg-yellow', 'bg-orange', 'bg-success/30'];
const EDIT_NOTICE_MS = 6000;

export function personColour(userId: string, team: TeamMemberDTO[]) {
  const index = Math.max(0, team.findIndex((m) => m.id === userId));
  return COLOURS[index % COLOURS.length];
}

export function initials(name: string) {
  const parts = name.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

export function Avatar({ name, colour, className }: { name: string; colour: string; className?: string }) {
  return (
    <span
      className={cn('inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-cocoa ring-2 ring-surface', colour, className)}
      title={name}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function TeamBar({
  team,
  meId,
  presence,
  lastEdit,
  describeField,
  describeView,
  onJump,
}: {
  team: TeamMemberDTO[];
  meId: string;
  presence: PresenceDTO[];
  lastEdit: RemoteEdit | null;
  describeField: (ref: FieldRef) => string;
  describeView: (viewing: string) => string;
  onJump: (ref: FieldRef | string) => void;
}) {
  const others = team.filter((m) => m.id !== meId);
  if (others.length === 0) return null;
  const now = Date.now();
  const names = ['You', ...others.map((m) => m.name)];
  const recentEdit = lastEdit && now - lastEdit.at < EDIT_NOTICE_MS ? lastEdit : null;

  function activity(member: TeamMemberDTO): { text: string; target: FieldRef | string | null } {
    const p = presence.find((x) => x.userId === member.id);
    if (!member.joined) return { text: `${member.name} has not joined yet`, target: null };
    if (!p || now - Date.parse(p.seenAt) > LIVE_AWAY_MS) return { text: `${member.name} is away`, target: null };
    if (p.focus) return { text: `${member.name} is ${p.typing ? 'typing in' : 'on'} ${describeField(p.focus)}`, target: p.focus };
    if (p.viewing) return { text: `${member.name} is looking at ${describeView(p.viewing)}`, target: p.viewing };
    return { text: `${member.name} is here`, target: null };
  }

  return (
    <div className="rounded-lg border border-sky bg-sky/40 px-4 py-3 text-sm text-cocoa" role="status" aria-live="polite">
      <p className="flex items-start gap-2">
        <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          <span className="font-medium">{joinNames(names)} are rating this deck together on one shared sheet.</span> Anything anyone types or clears shows up for
          everyone straight away. Split the responses between you so you don&apos;t write over each other, then one of you submits for the team.
        </span>
      </p>
      <ul className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-4">
        {others.map((member) => {
          const { text, target } = activity(member);
          const live = presence.some((p) => p.userId === member.id && now - Date.parse(p.seenAt) <= LIVE_AWAY_MS);
          return (
            <li key={member.id} className="flex min-w-0 items-center gap-2">
              <Avatar name={member.name} colour={personColour(member.id, team)} className={cn(!live && 'opacity-50')} />
              {target ? (
                <button type="button" onClick={() => onJump(target)} className="truncate text-left underline-offset-2 hover:underline">
                  {text}
                </button>
              ) : (
                <span className="truncate text-fg-muted">{text}</span>
              )}
            </li>
          );
        })}
      </ul>
      {recentEdit && (
        <p className="mt-2 text-meta text-fg-muted">
          {team.find((m) => m.id === recentEdit.userId)?.name ?? 'A teammate'} just changed{' '}
          <button type="button" className="underline underline-offset-2" onClick={() => onJump(recentEdit.ref)}>
            {describeField(recentEdit.ref)}
          </button>
        </p>
      )}
    </div>
  );
}
