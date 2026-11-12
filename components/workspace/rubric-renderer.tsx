'use client';

import { Fragment, type ReactNode } from 'react';
import {
  answerKey,
  type AnswerMap,
  type AnswerValue,
  type RankingValue,
  type ResponseDTO,
  type ReviewCommentDTO,
  type RubricFieldDef,
} from '@/lib/shared';
import { cn } from '@/lib/cn';
import { Select } from '../ui/form';
import { FieldCommentButton, type CommentDraft } from './field-comment-button';
import { RankPicker } from './rank-picker';
import { RationaleField } from './rationale-field';
import { ScaleSelector } from './scale-selector';

export interface CommentHandlers {
  canAdd: boolean;
  onAdd?: (field: RubricFieldDef, responseId: string | null, draft: CommentDraft) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
}

export interface RubricRendererProps {
  fields: RubricFieldDef[];
  responseId: string | null;
  responses: Pick<ResponseDTO, 'id' | 'label'>[];
  answers: AnswerMap;
  onChange: (field: RubricFieldDef, responseId: string | null, value: AnswerValue) => void;
  readOnly: boolean;
  comments: ReviewCommentDTO[];
  commentHandlers?: CommentHandlers;
  invalidKeys?: Set<string>;
  independenceCheck?: boolean;
  textFooter?: (field: RubricFieldDef, responseId: string | null) => ReactNode;
}

export function fieldDomId(fieldId: string, responseId: string | null) {
  return `field-${answerKey(fieldId, responseId).replace(':', '-')}`;
}

interface Block {
  primary: RubricFieldDef;
  explanation?: RubricFieldDef;
}

function toBlocks(fields: RubricFieldDef[]): Block[] {
  const blocks: Block[] = [];
  for (const field of fields) {
    const previous = blocks[blocks.length - 1];
    const pairs = previous && previous.primary.type === 'SCALE' && !previous.explanation && field.type === 'TEXTAREA' && field.key === `${previous.primary.key}_explanation`;
    if (pairs) previous.explanation = field;
    else blocks.push({ primary: field });
  }
  return blocks;
}

export function RubricRenderer({
  fields,
  responseId,
  responses,
  answers,
  onChange,
  readOnly,
  comments,
  commentHandlers,
  invalidKeys,
  independenceCheck,
  textFooter,
}: RubricRendererProps) {
  const scope = responseId ? 'PER_RESPONSE' : 'PER_TASK';
  const scoped = fields.filter((f) => f.scope === scope).sort((a, b) => a.order - b.order);
  const blocks = toBlocks(scoped);

  const valueOf = (field: RubricFieldDef) => answers[answerKey(field.id, responseId)] ?? null;
  const commentsFor = (field: RubricFieldDef) =>
    comments.filter((c) => c.fieldId === field.id && (c.responseId ?? null) === responseId);
  const invalid = (field: RubricFieldDef) => invalidKeys?.has(answerKey(field.id, responseId)) ?? false;

  function commentButton(field: RubricFieldDef) {
    if (!commentHandlers) return null;
    const numeric = field.type === 'SCALE' ? { min: field.config.min ?? 1, max: field.config.max ?? 7 } : undefined;
    return (
      <FieldCommentButton
        comments={commentsFor(field)}
        canAdd={commentHandlers.canAdd}
        suggestNumeric={numeric}
        onAdd={commentHandlers.onAdd ? (draft) => commentHandlers.onAdd!(field, responseId, draft) : undefined}
        onDelete={commentHandlers.onDelete}
      />
    );
  }

  function control(field: RubricFieldDef, labelled: string) {
    const id = `${fieldDomId(field.id, responseId)}-input`;
    const value = valueOf(field);
    const change = (next: AnswerValue) => onChange(field, responseId, next);
    switch (field.type) {
      case 'SCALE':
        return (
          <ScaleSelector
            id={id}
            label={labelled}
            config={field.config}
            value={typeof value === 'number' ? value : null}
            onChange={change}
            readOnly={readOnly}
            invalid={invalid(field)}
          />
        );
      case 'TEXTAREA':
        return (
          <>
            <RationaleField
              id={id}
              label={labelled}
              config={field.config}
              value={typeof value === 'string' ? value : ''}
              onChange={change}
              readOnly={readOnly}
              invalid={invalid(field)}
              independenceCheck={independenceCheck && scope === 'PER_RESPONSE'}
            />
            {textFooter?.(field, responseId)}
          </>
        );
      case 'RANKING':
        return (
          <RankPicker
            id={id}
            responses={responses}
            value={(value as RankingValue) ?? {}}
            onChange={change}
            readOnly={readOnly}
            required={field.required}
          />
        );
      case 'SELECT':
        return (
          <Select id={id} value={typeof value === 'string' ? value : ''} disabled={readOnly} onChange={(e) => change(e.target.value)} aria-invalid={invalid(field) || undefined}>
            <option value="">Choose…</option>
            {(field.config.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        );
      case 'CHECKBOX':
        return (
          <label className="inline-flex items-center gap-2 text-[15px]">
            <input
              id={id}
              type="checkbox"
              className="h-4 w-4 accent-[var(--primary)]"
              checked={value === true}
              disabled={readOnly}
              onChange={(e) => change(e.target.checked)}
            />
            {field.helpText ?? 'Yes'}
          </label>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      {blocks.map(({ primary, explanation }) => {
        if (primary.type === 'SECTION') {
          return (
            <h2 key={primary.id} className="border-b border-border pb-2 text-section font-medium">
              {primary.label}
            </h2>
          );
        }
        const required = primary.required || explanation?.required;
        return (
          <section
            key={primary.id}
            id={fieldDomId(primary.id, responseId)}
            className={cn('scroll-mt-32 space-y-3 rounded-md', (invalid(primary) || (explanation && invalid(explanation))) && 'ring-2 ring-danger/30 ring-offset-4 ring-offset-surface')}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-[15px] leading-[1.45] font-semibold">
                  {primary.label}
                  {required && (
                    <span className="text-danger" aria-label="required">
                      {' '}*
                    </span>
                  )}
                </h3>
                {primary.helpText && primary.type !== 'CHECKBOX' && (
                  <p className="mt-1 text-[15px] leading-[1.45] font-medium text-fg-muted">{primary.helpText}</p>
                )}
              </div>
              {commentButton(primary)}
            </div>
            {control(primary, primary.label)}
            {explanation && (
              <Fragment>
                <div id={fieldDomId(explanation.id, responseId)} className="flex items-start gap-2 scroll-mt-32">
                  <div className="min-w-0 flex-1">{control(explanation, `${primary.label} explanation`)}</div>
                  {commentButton(explanation)}
                </div>
              </Fragment>
            )}
          </section>
        );
      })}
    </div>
  );
}
