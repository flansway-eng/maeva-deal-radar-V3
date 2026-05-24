"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface TiptapEditorProps {
  content: string;
  onChange: (plainText: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Rédigez votre message…",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: textToHtml(content),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[220px] px-4 py-3 text-sm text-[#E8EAED] focus:outline-none",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getText());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getText();
    if (current !== content) {
      editor.commands.setContent(textToHtml(content));
    }
  }, [content, editor]);

  return (
    <div className="rounded-lg border border-[#1F232B] bg-[#0A0B0D] overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1F232B] bg-[#111317]">
        <ToolbarBtn
          label="Gras"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolbarBtn
          label="Italique"
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        />
        <ToolbarBtn
          label="Liste"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />
        <span className="ml-auto text-[10px] font-mono text-[#9AA0A6]/60">
          {placeholder}
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 text-[10px] font-mono rounded border cursor-pointer transition-colors ${
        active
          ? "border-[#5B8DEF]/40 bg-[#5B8DEF]/10 text-[#5B8DEF]"
          : "border-[#1F232B] text-[#9AA0A6] hover:text-[#E8EAED]"
      }`}
    >
      {label}
    </button>
  );
}

function textToHtml(text: string): string {
  if (!text) return "<p></p>";
  return text
    .split("\n")
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
