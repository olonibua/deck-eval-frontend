'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading2, Italic, Link as LinkIcon, List, ListOrdered, Quote } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePrompt } from '../ui/dialog-provider';

export function RichTextEditor({ value, onChange, label }: { value: string; onChange: (html: string) => void; label: string }) {
  const prompt = usePrompt();
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } })],
    content: value,
    editorProps: { attributes: { class: 'prose-brief min-h-40 px-3 py-2 focus:outline-none', 'aria-label': label } },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  if (!editor) return <div className="h-48 rounded-md border border-border-strong bg-surface" />;

  const tools = [
    { icon: Bold, label: 'Bold', active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run() },
    { icon: Italic, label: 'Italic', active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run() },
    { icon: Heading2, label: 'Heading', active: editor.isActive('heading', { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: List, label: 'Bulleted list', active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run() },
    { icon: ListOrdered, label: 'Numbered list', active: editor.isActive('orderedList'), run: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: Quote, label: 'Quote', active: editor.isActive('blockquote'), run: () => editor.chain().focus().toggleBlockquote().run() },
    {
      icon: LinkIcon,
      label: 'Link',
      active: editor.isActive('link'),
      run: async () => {
        const href = await prompt({
          title: 'Add a link',
          description: 'Leave it empty to remove the link from the selected text.',
          label: 'Link URL',
          type: 'url',
          placeholder: 'https://',
          defaultValue: editor.getAttributes('link').href ?? '',
          confirmLabel: 'Save link',
        });
        if (href === null) return;
        if (href === '') editor.chain().focus().unsetLink().run();
        else editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
      },
    },
  ];

  return (
    <div className="overflow-hidden rounded-md border border-border-strong bg-surface focus-within:border-primary">
      <div className="flex gap-0.5 border-b border-border bg-subtle p-1" role="toolbar" aria-label={`${label} formatting`}>
        {tools.map(({ icon: Icon, label: toolLabel, active, run }) => (
          <button
            key={toolLabel}
            type="button"
            onClick={run}
            aria-label={toolLabel}
            aria-pressed={active}
            className={cn('inline-flex h-7 w-7 items-center justify-center rounded-sm text-fg-muted hover:bg-muted hover:text-fg', active && 'bg-muted text-fg')}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
