import { cn } from '@mb/ui-primitives';
import { EditorContent, useEditor } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import StarterKit from '@tiptap/starter-kit';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';

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
  const { field } = useController({ name, control });

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: field.value || '',
    onUpdate: ({ editor: ed }) => {
      field.onChange(ed.getHTML());
    },
  });

  return (
    <div
      className={cn(
        'min-h-[200px] rounded-md border border-input bg-background px-3 py-2',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className,
      )}
    >
      <EditorContent editor={editor} className="prose prose-sm max-w-none" />
    </div>
  );
}
