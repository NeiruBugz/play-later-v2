"use client";

import CharacterCount from "@tiptap/extension-character-count";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useCallback, useEffect } from "react";

import { Button } from "@/shared/components/ui/button";
import { isContentEmpty, MAX_CHARACTERS } from "@/shared/lib/rich-text";
import { cn } from "@/shared/lib/ui/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onValidationChange?: (isValid: boolean) => void;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your journal entry...",
  disabled = false,
  className,
  onValidationChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable heading and other features we don't need
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        code: false,
      }),
      CharacterCount.configure({
        limit: MAX_CHARACTERS,
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false, // Prevent SSR hydration mismatches
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);

      // Validate content
      if (onValidationChange) {
        const isValid = html.length <= MAX_CHARACTERS && !isContentEmpty(html);
        onValidationChange(isValid);
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-3xl py-md",
      },
    },
  });

  // Update editor content when value prop changes (for edit mode)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  const characterCount = editor.storage.characterCount.characters();
  const remainingCharacters = MAX_CHARACTERS - characterCount;
  const isOverLimit = characterCount > MAX_CHARACTERS;

  return (
    <div className={cn("space-y-md", className)}>
      {/* Toolbar */}
      <div className="gap-sm bg-muted/30 p-sm flex flex-wrap items-center rounded-lg border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBold}
          disabled={disabled}
          aria-label="Bold"
          className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-muted")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleItalic}
          disabled={disabled}
          aria-label="Italic"
          className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-muted")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="bg-border h-6 w-px" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBulletList}
          disabled={disabled}
          aria-label="Bullet List"
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bulletList") && "bg-muted"
          )}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleOrderedList}
          disabled={disabled}
          aria-label="Numbered List"
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("orderedList") && "bg-muted"
          )}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="ml-auto" />
        {/* Character Counter */}
        <div
          className={cn(
            "text-muted-foreground text-xs",
            isOverLimit && "text-destructive"
          )}
        >
          {remainingCharacters < 0 ? (
            <span className="font-medium">
              {Math.abs(remainingCharacters)} over limit
            </span>
          ) : (
            <span>{remainingCharacters} remaining</span>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="border-input bg-background relative rounded-lg border">
        <EditorContent editor={editor} />
        {!editor.getText() && (
          <div className="text-muted-foreground left-3xl top-md pointer-events-none absolute text-sm">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export helper functions for convenience (these are now in shared/lib/rich-text)
export {
  stripHtmlTags,
  isContentEmpty,
  MAX_CHARACTERS,
} from "@/shared/lib/rich-text";
