'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  answerKey,
  FIELD_SCOPES,
  FIELD_TYPES,
  type AnswerMap,
  type FieldConfig,
  type FieldScope,
  type FieldType,
  type RubricFieldDef,
  type TemplateDTO,
} from '@/lib/shared';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { cn } from '@/lib/cn';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { FieldError, Input, Label, Select, Textarea } from '../ui/form';
import { RubricRenderer } from '../workspace/rubric-renderer';

type DraftField = RubricFieldDef & { open?: boolean };

const TYPE_LABELS: Record<FieldType, string> = {
  SCALE: 'Scale',
  TEXTAREA: 'Explanation',
  RANKING: 'Ranking',
  SELECT: 'Select',
  CHECKBOX: 'Checkbox',
  SECTION: 'Section heading',
};

const SAMPLE_RESPONSES = [
  { id: 'sample-a', label: 'A' },
  { id: 'sample-b', label: 'B' },
  { id: 'sample-c', label: 'C' },
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'field';
}

function defaultConfig(type: FieldType): FieldConfig {
  if (type === 'SCALE') return { min: 1, max: 7, labels: { '1': 'Poor', '7': 'Excellent' } };
  if (type === 'TEXTAREA') return { minChars: 40, maxChars: 2000, placeholder: '' };
  if (type === 'SELECT') return { options: ['Yes', 'No'] };
  return {};
}

let tempId = 0;
function newField(type: FieldType, scope: FieldScope, existingKeys: string[]): DraftField {
  const label = type === 'SECTION' ? 'New section' : `New ${TYPE_LABELS[type].toLowerCase()} field`;
  let key = slugify(label);
  let n = 2;
  while (existingKeys.includes(key)) key = `${slugify(label)}_${n++}`;
  return { id: `new-${++tempId}`, key, order: 0, label, helpText: '', type, scope, required: type !== 'SECTION', config: defaultConfig(type), open: true };
}

function FieldEditor({ field, onChange, onRemove }: { field: DraftField; onChange: (patch: Partial<DraftField>) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const setConfig = (patch: Partial<FieldConfig>) => onChange({ config: { ...field.config, ...patch } });
  const num = (v: string) => (v === '' ? undefined : Number(v));
  const minKey = String(field.config.min ?? 1);
  const maxKey = String(field.config.max ?? 7);

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('rounded-md border border-border bg-surface', isDragging && 'z-10 shadow-pop')}>
      <div className="flex items-center gap-2 px-2 py-2">
        <button type="button" className="inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-sm text-fg-muted hover:bg-muted" aria-label={`Drag ${field.label}`} {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onChange({ open: !field.open })} aria-expanded={field.open}>
          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-fg-muted uppercase">{TYPE_LABELS[field.type]}</span>
          <span className={cn('truncate text-sm', field.type === 'SECTION' ? 'font-semibold' : 'font-medium')}>{field.label}</span>
          {field.required && <span className="text-danger">*</span>}
          <span className="ml-auto hidden text-meta whitespace-nowrap text-fg-subtle sm:inline">{field.scope === 'PER_RESPONSE' ? 'per response' : 'per task'}</span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-fg-muted transition-transform', field.open && 'rotate-180')} aria-hidden />
        </button>
        <button type="button" onClick={onRemove} className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-fg-muted hover:bg-danger-soft hover:text-danger" aria-label={`Remove ${field.label}`}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {field.open && (
        <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor={`${field.id}-label`}>Label</Label>
            <Input id={`${field.id}-label`} value={field.label} onChange={(e) => onChange({ label: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={`${field.id}-help`}>Help text</Label>
            <Textarea id={`${field.id}-help`} rows={2} value={field.helpText ?? ''} onChange={(e) => onChange({ helpText: e.target.value })} />
          </div>
          <div>
            <Label htmlFor={`${field.id}-key`}>Export key</Label>
            <Input id={`${field.id}-key`} value={field.key} onChange={(e) => onChange({ key: slugify(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor={`${field.id}-type`}>Type</Label>
              <Select id={`${field.id}-type`} value={field.type} onChange={(e) => onChange({ type: e.target.value as FieldType, config: defaultConfig(e.target.value as FieldType) })}>
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor={`${field.id}-scope`}>Scope</Label>
              <Select id={`${field.id}-scope`} value={field.scope} onChange={(e) => onChange({ scope: e.target.value as FieldScope })}>
                {FIELD_SCOPES.map((s) => (
                  <option key={s} value={s}>
                    {s === 'PER_RESPONSE' ? 'Per response' : 'Per task'}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {field.type !== 'SECTION' && (
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" className="accent-[var(--primary)]" checked={field.required} onChange={(e) => onChange({ required: e.target.checked })} />
              Required
            </label>
          )}
          {field.type === 'SCALE' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`${field.id}-min`}>Min</Label>
                  <Input id={`${field.id}-min`} type="number" value={field.config.min ?? 1} onChange={(e) => setConfig({ min: num(e.target.value) })} />
                </div>
                <div>
                  <Label htmlFor={`${field.id}-max`}>Max</Label>
                  <Input id={`${field.id}-max`} type="number" value={field.config.max ?? 7} onChange={(e) => setConfig({ max: num(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`${field.id}-start`}>Start label</Label>
                  <Input id={`${field.id}-start`} value={field.config.labels?.[minKey] ?? ''} onChange={(e) => setConfig({ labels: { ...field.config.labels, [minKey]: e.target.value } })} />
                </div>
                <div>
                  <Label htmlFor={`${field.id}-end`}>End label</Label>
                  <Input id={`${field.id}-end`} value={field.config.labels?.[maxKey] ?? ''} onChange={(e) => setConfig({ labels: { ...field.config.labels, [maxKey]: e.target.value } })} />
                </div>
              </div>
            </>
          )}
          {field.type === 'TEXTAREA' && (
            <>
              <div className="sm:col-span-2">
                <Label htmlFor={`${field.id}-ph`}>Placeholder</Label>
                <Input id={`${field.id}-ph`} value={field.config.placeholder ?? ''} onChange={(e) => setConfig({ placeholder: e.target.value })} />
              </div>
              <div>
                <Label htmlFor={`${field.id}-minc`}>Minimum characters</Label>
                <Input id={`${field.id}-minc`} type="number" min={0} value={field.config.minChars ?? ''} onChange={(e) => setConfig({ minChars: num(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor={`${field.id}-maxc`}>Maximum characters</Label>
                <Input id={`${field.id}-maxc`} type="number" min={1} value={field.config.maxChars ?? ''} onChange={(e) => setConfig({ maxChars: num(e.target.value) })} />
              </div>
            </>
          )}
          {field.type === 'SELECT' && (
            <div className="sm:col-span-2">
              <Label htmlFor={`${field.id}-opts`}>Options (one per line)</Label>
              <Textarea
                id={`${field.id}-opts`}
                rows={3}
                value={(field.config.options ?? []).join('\n')}
                onChange={(e) => setConfig({ options: e.target.value.split('\n').map((o) => o.trim()).filter(Boolean) })}
              />
            </div>
          )}
          {field.type === 'TEXTAREA' && field.scope === 'PER_RESPONSE' && (
            <p className="text-meta text-fg-muted sm:col-span-2">Tip: give it the key of the scale above plus &quot;_explanation&quot; to show it under that scale.</p>
          )}
        </div>
      )}
    </li>
  );
}

export function TemplateBuilder({ template }: { template: TemplateDTO | null }) {
  const router = useRouter();
  const [name, setName] = useState(template?.name ?? 'New rubric');
  const [fields, setFields] = useState<DraftField[]>(template?.fields ?? []);
  const [addType, setAddType] = useState<FieldType>('SCALE');
  const [addScope, setAddScope] = useState<FieldScope>('PER_RESPONSE');
  const [preview, setPreview] = useState<string | null>(SAMPLE_RESPONSES[0].id);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const previewFields = useMemo(() => fields.map((f, order) => ({ ...f, order })), [fields]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((current) => arrayMove(current, current.findIndex((f) => f.id === active.id), current.findIndex((f) => f.id === over.id)));
  }

  async function save() {
    setBusy(true);
    setError(null);
    const payload = {
      name,
      fields: fields.map(({ key, label, helpText, type, scope, required, config }) => ({ key, label, helpText: helpText || null, type, scope, required, config })),
    };
    try {
      const saved = template ? await api.put<TemplateDTO>(`/admin/templates/${template.id}`, payload) : await api.post<TemplateDTO>('/admin/templates', payload);
      toast.success(template && saved.id !== template.id ? `Saved as version ${saved.version}` : 'Rubric saved');
      router.push(`/admin/templates/${saved.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.issues.length ? err.issues.map((i) => `${i.path ? `${i.path}: ` : ''}${i.message}`).join(' · ') : err.message);
      else setError('Could not save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
      <div className="space-y-4">
        <Card className="space-y-4 p-5">
          <div>
            <Label htmlFor="template-name">Rubric name</Label>
            <Input id="template-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {template && template.submissionCount > 0 && (
            <p className="rounded-md bg-info-soft px-3 py-2 text-sm text-info">
              {template.submissionCount} {template.submissionCount === 1 ? 'submission uses' : 'submissions use'} version {template.version}. Saving creates version {template.version + 1}; existing submissions keep the old one.
            </p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {fields.map((field) => (
                  <FieldEditor
                    key={field.id}
                    field={field}
                    onChange={(patch) => setFields((current) => current.map((f) => (f.id === field.id ? { ...f, ...patch } : f)))}
                    onRemove={() => setFields((current) => current.filter((f) => f.id !== field.id))}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
            <div className="w-full sm:w-auto">
              <Label htmlFor="add-type">Add field</Label>
              <Select id="add-type" value={addType} onChange={(e) => setAddType(e.target.value as FieldType)} className="sm:w-44">
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            <Select aria-label="Scope for new field" value={addScope} onChange={(e) => setAddScope(e.target.value as FieldScope)} className="min-w-0 flex-1 sm:w-40 sm:flex-none">
              <option value="PER_RESPONSE">Per response</option>
              <option value="PER_TASK">Per task</option>
            </Select>
            <Button variant="secondary" onClick={() => setFields((current) => [...current, newField(addType, addScope, current.map((f) => f.key))])}>
              <Plus className="h-4 w-4" aria-hidden /> Add
            </Button>
          </div>
          <FieldError>{error}</FieldError>
          <Button onClick={save} loading={busy}>
            Save rubric
          </Button>
        </Card>
      </div>
      <div>
        <Card className="p-5 xl:sticky xl:top-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-section font-medium">Live preview</h2>
            <div className="flex gap-1">
              {SAMPLE_RESPONSES.map((r) => (
                <Button key={r.id} size="sm" variant={preview === r.id ? 'primary' : 'secondary'} onClick={() => setPreview(r.id)}>
                  {r.label}
                </Button>
              ))}
              <Button size="sm" variant={preview === null ? 'primary' : 'secondary'} onClick={() => setPreview(null)}>
                Ranking
              </Button>
            </div>
          </div>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
            <RubricRenderer
              fields={previewFields}
              responseId={preview}
              responses={SAMPLE_RESPONSES}
              answers={answers}
              onChange={(field, responseId, value) => setAnswers((a) => ({ ...a, [answerKey(field.id, responseId)]: value }))}
              readOnly={false}
              comments={[]}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
