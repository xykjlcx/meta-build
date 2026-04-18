import { cn } from '@mb/ui-primitives';
import Image from '@tiptap/extension-image';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RotateCcw,
  Strikethrough,
} from 'lucide-react';
import { useEffect } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface TipTapFieldProps {
  name: string;
  // biome-ignore lint/suspicious/noExplicitAny: RHF Control 泛型需要 any
  control: Control<any>;
  className?: string;
}

/**
 * TipTap 富文本编辑器 — 桥接 React Hook Form。
 *
 * 使用 useController 实现 HTML string <-> TipTap Editor 双向同步。
 * TipTap 的数据模型（ProseMirror doc）与 RHF 的 string 值不直接兼容，
 * 此包装层负责转换。
 */
export function TipTapField({ name, control, className }: TipTapFieldProps) {
  const { t } = useTranslation('notice');
  const { field } = useController({ name, control });

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: field.value || '',
    editorProps: {
      attributes: {
        class:
          'ProseMirror min-h-[320px] px-5 py-4 text-[15px] leading-7 text-foreground outline-none prose prose-neutral max-w-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      field.onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextHtml = field.value || '';
    if (editor.getHTML() !== nextHtml) {
      editor.commands.setContent(nextHtml, { emitUpdate: false });
    }
  }, [editor, field.value]);

  if (!editor) {
    return (
      <div
        className={cn('overflow-hidden rounded-xl border border-border bg-background', className)}
      >
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: 静态骨架占位
                key={index}
                className="h-8 w-8 animate-pulse rounded-md bg-border/70"
              />
            ))}
          </div>
        </div>
        <div className="min-h-[320px] animate-pulse bg-border/40" />
      </div>
    );
  }

  const ToolbarButton = ({
    active,
    label,
    onClick,
    children,
  }: {
    active?: boolean;
    label: string;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground',
        active && 'border-border bg-background text-foreground shadow-xs',
      )}
    >
      {children}
    </button>
  );

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-input bg-background shadow-xs',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/35 px-4 py-3">
        <ToolbarButton
          label={t('editor.heading1')}
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={t('editor.heading2')}
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={t('editor.bold')}
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={t('editor.italic')}
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={t('editor.strike')}
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          label={t('editor.bulletList')}
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={t('editor.orderedList')}
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={t('editor.quote')}
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton label={t('editor.undo')} onClick={() => editor.chain().focus().undo().run()}>
          <RotateCcw className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={t('editor.redo')} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="size-4" />
        </ToolbarButton>
        <span className="ml-auto text-xs text-muted-foreground">{t('editor.tip')}</span>
      </div>

      <div className="relative min-h-[320px] bg-background">
        {!field.value && (
          <div className="pointer-events-none absolute top-4 left-5 text-sm text-muted-foreground">
            {t('editor.placeholder')}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
