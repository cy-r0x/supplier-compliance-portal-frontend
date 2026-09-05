"use client";

import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, type ReactNode } from "react";

type TiptapEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
};

function ToolbarButton({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`cursor-pointer rounded-[6px] px-2 py-1 text-[12px] font-medium transition-colors duration-150 ${
        active
          ? "bg-brand-100 text-brand-700"
          : "text-text-secondary hover:bg-bg-muted hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function setEditorLink(editor: NonNullable<ReturnType<typeof useEditor>>) {
  if (editor.isActive("link")) {
    editor.chain().focus().unsetLink().run();
    return;
  }

  const previousUrl = editor.getAttributes("link").href as string | undefined;
  const { from, to, empty } = editor.state.selection;

  const url = window.prompt("Enter URL", previousUrl ?? "https://");
  if (url === null) return;

  const href = normalizeUrl(url);
  if (!href) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  if (empty) {
    editor
      .chain()
      .focus()
      .setTextSelection(from)
      .insertContent({
        type: "text",
        text: href,
        marks: [{ type: "link", attrs: { href } }],
      })
      .run();
    return;
  }

  editor.chain().focus().setTextSelection({ from, to }).setLink({ href }).run();
}

export function isEmptyHtml(html: string) {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  return text.length === 0;
}

export default function TiptapEditor({
  id,
  value,
  onChange,
  placeholder,
  invalid,
}: TiptapEditorProps) {
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class:
          "tiptap-editor-content min-h-[88px] px-3 py-2.5 text-[13px] text-text-primary outline-none",
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      isInternalUpdate.current = true;
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const current = editor.getHTML();
    if (value !== current && !(value === "" && current === "<p></p>")) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className={`mt-2 min-h-[120px] animate-pulse rounded-[9px] border bg-bg-muted ${
          invalid ? "border-danger-500" : "border-border-subtle"
        }`}
      />
    );
  }

  return (
    <div
      className={`tiptap-editor mt-2 overflow-hidden rounded-[9px] border bg-bg-elevated transition-[border-color,box-shadow] duration-150 focus-within:ring-2 ${
        invalid
          ? "border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500/20"
          : "border-border-subtle focus-within:border-focus-ring focus-within:ring-focus-ring/25"
      }`}
    >
      <div className="flex flex-wrap gap-1 border-b border-border-subtle bg-bg-muted/40 px-2 py-1.5">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarButton>
        <span className="mx-0.5 w-px self-stretch bg-border-subtle" aria-hidden />
        <ToolbarButton
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          label="Paragraph"
          active={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          P
        </ToolbarButton>
        <span className="mx-0.5 w-px self-stretch bg-border-subtle" aria-hidden />
        <ToolbarButton
          label="Link"
          active={editor.isActive("link")}
          onClick={() => setEditorLink(editor)}
        >
          Link
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
